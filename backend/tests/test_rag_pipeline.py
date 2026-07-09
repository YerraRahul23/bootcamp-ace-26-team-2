"""
Tests for RAGPipelineService and RAGResponse model.

Uses a FakeLLM and FakeEmbedder-based RetrievalService
so tests are fast and have no external dependencies.
"""

import uuid

import pytest

from app.models.embedding import Embedding
from app.models.search_result import SearchResult
from app.models.rag_response import RAGResponse
from app.services.rag_pipeline_service import RAGPipelineService
from app.services.retrieval_service import RetrievalService
from app.services.faiss_index_service import FaissIndexService
from app.prompts.system_prompt import SYSTEM_PROMPT


class FakeEmbedder:
    """A fake embedding model that returns deterministic vectors."""

    def __init__(self, dimension: int = 4) -> None:
        self.dimension = dimension

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [
            [float((len(text) + i) % 10) / 10.0 for _ in range(self.dimension)]
            for i, text in enumerate(texts)
        ]


class FakeLLM:
    """A fake LLM that returns a canned response."""

    def __init__(self, response: str = "Based on the provided context, the confidentiality clause applies.") -> None:
        self.response = response
        self.last_prompt: str = ""

    def generate_content(self, prompt: str):
        self.last_prompt = prompt
        return type("Response", (), {"text": self.response})()


def make_embedding(vector: list[float], **overrides) -> Embedding:
    fields = {
        "id": str(uuid.uuid4()),
        "chunk_id": str(uuid.uuid4()),
        "document_id": str(uuid.uuid4()),
        "vector": vector,
        "metadata": {"filename": "nda.txt", "partition": "Part_I"},
    }
    fields.update(overrides)
    return Embedding(**fields)


def make_retrieval_service(embeddings, chunk_texts=None) -> RetrievalService:
    """Build a RetrievalService with a pre-built FAISS index and fake embedder."""
    index_service = FaissIndexService()
    index_service.build_index(embeddings, chunk_texts=chunk_texts)

    fake = FakeEmbedder(dimension=4)
    embed_service = type("FakeEmbedService", (), {"_embed_texts": fake.embed_documents})()

    return RetrievalService(embed_service=embed_service, index_service=index_service)


# ------------------------------------------------------------------
# answer
# ------------------------------------------------------------------


def test_answer_basic():
    embeddings = [make_embedding([1.0, 0.0, 0.0, 0.0])]
    chunk_texts = ["The receiving party shall maintain confidentiality of all proprietary information."]
    retrieval = make_retrieval_service(embeddings, chunk_texts)
    fake_llm = FakeLLM()

    service = RAGPipelineService(retrieval_service=retrieval, llm=fake_llm)
    result = service.answer("What does confidentiality mean?")

    assert isinstance(result, RAGResponse)
    assert result.query == "What does confidentiality mean?"
    assert result.answer == fake_llm.response
    assert len(result.sources) > 0
    assert result.context
    assert result.model


def test_answer_empty_question():
    retrieval = make_retrieval_service([make_embedding([1.0, 0.0, 0.0, 0.0])])
    fake_llm = FakeLLM()
    service = RAGPipelineService(retrieval_service=retrieval, llm=fake_llm)

    result = service.answer("")
    assert result.answer == "Please provide a question."
    assert result.sources == []
    assert result.context == ""


def test_answer_whitespace_question():
    retrieval = make_retrieval_service([make_embedding([1.0, 0.0, 0.0, 0.0])])
    fake_llm = FakeLLM()
    service = RAGPipelineService(retrieval_service=retrieval, llm=fake_llm)

    result = service.answer("   ")
    assert result.answer == "Please provide a question."
    assert result.sources == []


def test_answer_preserves_sources():
    emb = make_embedding([1.0, 0.0, 0.0, 0.0], metadata={"filename": "nda.txt", "clause": "confidentiality"})
    retrieval = make_retrieval_service([emb], ["Some text."])
    fake_llm = FakeLLM()
    service = RAGPipelineService(retrieval_service=retrieval, llm=fake_llm)

    result = service.answer("confidentiality")
    assert len(result.sources) == 1
    assert result.sources[0].metadata["clause"] == "confidentiality"


def test_answer_preserves_context():
    emb = make_embedding([1.0, 0.0, 0.0, 0.0])
    chunk_texts = ["Confidential information includes trade secrets and business strategies."]
    retrieval = make_retrieval_service([emb], chunk_texts)
    fake_llm = FakeLLM()
    service = RAGPipelineService(retrieval_service=retrieval, llm=fake_llm)

    result = service.answer("confidentiality")
    assert "Confidential information" in result.context


def test_answer_model_name():
    retrieval = make_retrieval_service([make_embedding([1.0, 0.0, 0.0, 0.0])])
    fake_llm = FakeLLM()
    service = RAGPipelineService(retrieval_service=retrieval, llm=fake_llm, model_name="gemini-test")

    result = service.answer("test")
    assert result.model == "gemini-test"


def test_answer_llm_failure():
    class FailingLLM:
        def generate_content(self, prompt):
            raise RuntimeError("API failure")

    retrieval = make_retrieval_service([make_embedding([1.0, 0.0, 0.0, 0.0])], ["Some text."])
    service = RAGPipelineService(retrieval_service=retrieval, llm=FailingLLM())

    result = service.answer("test")
    assert "error" in result.answer.lower()


def test_answer_no_context():
    """When no index is loaded, retrieval returns empty — answer should reflect that."""
    fake = FakeEmbedder()
    embed_service = type("FakeEmbedService", (), {"_embed_texts": fake.embed_documents})()
    retrieval = RetrievalService(embed_service=embed_service)
    fake_llm = FakeLLM()
    service = RAGPipelineService(retrieval_service=retrieval, llm=fake_llm)

    result = service.answer("test")
    assert result.sources == []


# ------------------------------------------------------------------
# Prompt building
# ------------------------------------------------------------------


def test_build_prompt_includes_system_prompt():
    retrieval = make_retrieval_service([make_embedding([1.0, 0.0, 0.0, 0.0])], ["Some text."])
    fake_llm = FakeLLM()
    service = RAGPipelineService(retrieval_service=retrieval, llm=fake_llm)

    service.answer("test question")
    assert SYSTEM_PROMPT in fake_llm.last_prompt
    assert "test question" in fake_llm.last_prompt
    assert "Context:" in fake_llm.last_prompt


# ------------------------------------------------------------------
# RAGResponse model
# ------------------------------------------------------------------


def test_rag_response_model():
    sources = [SearchResult(chunk_id="c1", document_id="d1", chunk_text="text", score=0.95, metadata={})]
    response = RAGResponse(
        query="q",
        answer="a",
        context="ctx",
        sources=sources,
        model="gemini-test",
    )
    assert response.query == "q"
    assert response.answer == "a"
    assert response.context == "ctx"
    assert len(response.sources) == 1
    assert response.model == "gemini-test"


def test_rag_response_defaults():
    response = RAGResponse(query="q")
    assert response.answer == ""
    assert response.context == ""
    assert response.sources == []
    assert response.model == ""


# ------------------------------------------------------------------
# Document ID filtering
# ------------------------------------------------------------------


def test_answer_with_document_id():
    """When document_id is passed, only chunks from that doc are retrieved."""
    doc_a_id = str(uuid.uuid4())
    doc_b_id = str(uuid.uuid4())

    embeddings = [
        make_embedding([1.0, 0.0, 0.0, 0.0], document_id=doc_a_id,
                       metadata={"document_id": doc_a_id, "filename": "a.txt"}),
        make_embedding([0.0, 1.0, 0.0, 0.0], document_id=doc_b_id,
                       metadata={"document_id": doc_b_id, "filename": "b.txt"}),
    ]
    chunk_texts = ["Exclusive jurisdiction clause.", "Arbitration clause."]
    retrieval = make_retrieval_service(embeddings, chunk_texts)
    fake_llm = FakeLLM()
    service = RAGPipelineService(retrieval_service=retrieval, llm=fake_llm)

    result = service.answer("jurisdiction", document_id=doc_a_id)
    assert len(result.sources) == 1
    assert result.sources[0].document_id == doc_a_id
