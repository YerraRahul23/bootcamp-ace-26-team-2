"""
RAG pipeline orchestration service.

Coordinates the end-to-end Retrieval-Augmented Generation flow:
1. Retrieve relevant document chunks using RetrievalService.
2. Build a prompt with system instructions + retrieved context.
3. Invoke Gemini to generate a grounded answer.
4. Return a RAGResponse with the answer, context, and sources.
"""

import logging
import traceback
from pathlib import Path

from app.core.config import settings
from app.models.search_result import SearchResult
from app.models.rag_response import RAGResponse
from app.prompts.system_prompt import SYSTEM_PROMPT
from app.services.retrieval_service import RetrievalService

logger = logging.getLogger(__name__)


class RAGPipelineService:
    """
    Orchestrates the RAG pipeline: retrieve → augment → generate.

    Usage::

        service = RAGPipelineService()
        result = service.answer("What does the NDA say about confidentiality?")
        print(result.answer)
    """

    def __init__(
        self,
        retrieval_service: RetrievalService | None = None,
        llm=None,
        model_name: str | None = None,
        temperature: float | None = None,
        max_tokens: int | None = None,
    ) -> None:
        """
        Initialize the RAGPipelineService.

        Args:
            retrieval_service: Injectable RetrievalService.
                               Defaults to a new instance (loads index from disk).
            llm: Injectable LLM with a ``generate_content(prompt)`` method.
                 Defaults to ``google.generativeai.GenerativeModel``.
            model_name: The Gemini model identifier.
                        Defaults to settings.GEMINI_MODEL.
            temperature: Generation temperature.
                         Defaults to settings.GEMINI_TEMPERATURE.
            max_tokens: Maximum output tokens.
                        Defaults to settings.GEMINI_MAX_TOKENS.
        """
        self._model_name = model_name or settings.GEMINI_MODEL
        self._temperature = temperature if temperature is not None else settings.GEMINI_TEMPERATURE
        self._max_tokens = max_tokens or settings.GEMINI_MAX_TOKENS

        # Initialize retrieval service
        if retrieval_service is not None:
            self._retrieval = retrieval_service
        else:
            self._retrieval = RetrievalService()
            self._retrieval.load_index()

        # Initialize LLM
        if llm is not None:
            self._llm = llm
        else:
            import google.generativeai as genai

            genai.configure(api_key=settings.GEMINI_API_KEY)
            self._llm = genai.GenerativeModel(
                model_name=self._model_name,
                generation_config={
                    "temperature": self._temperature,
                    "max_output_tokens": self._max_tokens,
                },
            )

        logger.info(
            "RAGPipelineService initialized: model=%s, temperature=%.2f, max_tokens=%d",
            self._model_name,
            self._temperature,
            self._max_tokens,
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def answer(
        self,
        question: str,
        document_id: str | None = None,
    ) -> RAGResponse:
        """
        Run the full RAG pipeline for a user question.

        Args:
            question: The user's question about the legal contracts.
            document_id: Optional document ID to scope retrieval.
                         When provided, only chunks belonging to that
                         document are searched.

        Returns:
            A RAGResponse containing the generated answer, context, and sources.
        """
        if not question or not question.strip():
            logger.warning("Empty question provided to RAG pipeline")
            return RAGResponse(
                query=question,
                answer="Please provide a question.",
                context="",
                sources=[],
                model=self._model_name,
            )

        logger.info("Incoming request: query='%s', document_id=%s", question[:80], document_id)

        # Step 1: Retrieve relevant context
        metadata_filter = {"document_id": document_id} if document_id else None
        retrieval_result = self._retrieval.retrieve(question, metadata_filter=metadata_filter)

        logger.info(
            "Retrieval results: count=%d, context_len=%d",
            len(retrieval_result.results),
            len(retrieval_result.context),
        )
        if retrieval_result.results:
            logger.info(
                "Retrieved document IDs: %s",
                [r.document_id for r in retrieval_result.results],
            )

        # Step 2: Build the prompt
        if not retrieval_result.context:
            logger.info("No relevant contract clauses found for query: '%s'", question[:80])
            return RAGResponse(
                query=question,
                answer="I could not find any relevant contract information to answer your question. Please try rephrasing or ask about a different topic.",
                context="",
                sources=[],
                model=self._model_name,
            )

        context = retrieval_result.context
        prompt = self._build_prompt(context, question)
        logger.info("Prompt generated: length=%d chars", len(prompt))

        # Step 3: Generate answer
        answer = self._generate(prompt)

        logger.info(
            "RAG pipeline completed: query='%s', sources=%d, context_len=%d, answer_len=%d",
            question[:50],
            len(retrieval_result.results),
            len(context),
            len(answer),
        )

        return RAGResponse(
            query=question,
            answer=answer,
            context=retrieval_result.context,
            sources=retrieval_result.results,
            model=self._model_name,
        )

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _build_prompt(self, context: str, question: str) -> str:
        """
        Build the full prompt from system instructions, context, and question.

        Args:
            context: The retrieved context string.
            question: The user's question.

        Returns:
            A formatted prompt string.
        """
        return f"{SYSTEM_PROMPT}\n\nContext:\n{context}\n\nQuestion: {question}\n\nAnswer:"

    def _generate(self, prompt: str) -> str:
        """
        Invoke the LLM to generate an answer.

        Args:
            prompt: The full prompt string.

        Returns:
            The generated answer text.
        """
        logger.info(
            "Gemini request: model=%s, prompt_len=%d chars",
            self._model_name,
            len(prompt),
        )
        try:
            response = self._llm.generate_content(prompt)
            logger.info(
                "Gemini response: received=True, length=%d chars",
                len(response.text) if hasattr(response, 'text') else 0,
            )
            return response.text
        except Exception as e:
            logger.error(
                "LLM generation failed: model=%s, error=%s\n%s",
                self._model_name,
                e,
                traceback.format_exc(),
            )
            return "I encountered an error while generating the answer. Please try again."
