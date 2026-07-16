"""
Document retrieval service.

Orchestrates query embedding and FAISS similarity search
to retrieve the top-k most relevant chunks for a user
question. Produces a RetrievalResult with a formatted
context string for downstream RAG consumption.

Uses hybrid retrieval: semantic search + keyword search
merged together for better recall on short keyword queries.
"""

import logging
import re
from pathlib import Path

from app.core.config import settings
from app.models.search_result import SearchResult
from app.models.retrieval_result import RetrievalResult
from app.services.embedding_service import EmbeddingService
from app.services.faiss_index_service import FaissIndexService

logger = logging.getLogger(__name__)

SYNONYM_MAP: dict[str, list[str]] = {
    "payment": ["pay", "freight", "fee", "charge", "billing", "clearance", "deposit", "invoice", "remuneration", "compensation", "rate", "tariff", "pricing"],
    "pay": ["payment", "freight", "fee", "charge", "billing", "clearance", "deposit", "invoice", "remuneration", "compensation"],
    "termination": ["terminate", "cancel", "end", "expire", "dissolve", "rescind", "breach", "default"],
    "terminate": ["termination", "cancel", "end", "expire", "dissolve", "rescind"],
    "liability": ["liable", "responsibility", "damage", "indemnify", "obligation", "duty", "loss"],
    "liable": ["liability", "responsibility", "damage", "indemnify", "obligation"],
    "confidential": ["confidentiality", "non-disclosure", "nda", "proprietary", "secret", "private"],
    "confidentiality": ["confidential", "non-disclosure", "nda", "proprietary", "secret"],
    "indemnify": ["indemnification", "indemnity", "hold harmless", "liable", "compensate"],
    "indemnification": ["indemnify", "indemnity", "hold harmless", "liable"],
    "insurance": ["insured", "coverage", "policy", "indemnify", "liability"],
    "warranty": ["warranties", "guarantee", "representation", "assurance"],
    "warranties": ["warranty", "guarantee", "representation", "assurance"],
    "dispute": ["arbitration", "litigation", "resolution", "governing law", "jurisdiction", "mediation"],
    "arbitration": ["dispute", "litigation", "resolution", "mediation"],
    "governing law": ["jurisdiction", "dispute", "applicable law", "venue"],
    "freight": ["payment", "charges", "clearance", "shipping", "transportation", "carriage", "delivery", "logistics"],
    "charges": ["payment", "fee", "freight", "cost", "rate", "pricing", "expense"],
    "fee": ["payment", "charge", "freight", "cost", "rate"],
    "clearance": ["freight", "payment", "settlement", "reconciliation"],
    "delivery": ["shipment", "freight", "transportation", "carriage", "handover"],
    "shipment": ["delivery", "freight", "transportation", "carriage"],
    "transportation": ["freight", "shipment", "carriage", "delivery", "logistics"],
    "agreement": ["contract", "terms", "conditions", "obligations"],
    "contract": ["agreement", "terms", "conditions"],
    "obligation": ["duty", "responsibility", "liable", "required", "shall"],
    "compliance": ["regulatory", "law", "legal", "requirement", "applicable"],
}


class RetrievalService:
    """
    Retrieves relevant document chunks for a user query.

    Embeds the query, searches a FAISS index, and returns
    a RetrievalResult with a formatted context string.

    Usage::

        service = RetrievalService()
        service.load_index()
        result = service.retrieve("What does the NDA say?")
        print(result.context)
    """

    def __init__(
        self,
        embed_service: EmbeddingService | None = None,
        index_service: FaissIndexService | None = None,
        top_k: int | None = None,
    ) -> None:
        """
        Initialize the RetrievalService.

        Args:
            embed_service: Injectable EmbeddingService.
                           Defaults to a new EmbeddingService.
            index_service: Injectable FaissIndexService.
                           If None, the index is lazy-loaded from disk.
            top_k: Number of results to return.
                   Defaults to settings.RETRIEVAL_TOP_K.
        """
        self._embed_service = embed_service or EmbeddingService()
        self._index_service = index_service
        self._top_k = top_k or settings.RETRIEVAL_TOP_K
        self._index_path = Path(settings.FAISS_INDEX_PATH)
        self._metadata_path = Path(settings.FAISS_METADATA_PATH)

        logger.info(
            "RetrievalService initialized: top_k=%d, index_service=%s",
            self._top_k,
            "injected" if index_service else "lazy-load",
        )

    # ------------------------------------------------------------------
    # Index management
    # ------------------------------------------------------------------

    def load_index(self) -> bool:
        """
        Load the FAISS index from disk.

        Returns:
            True if the index was loaded successfully, False otherwise.
        """
        if not self._index_path.exists():
            logger.warning("FAISS index not found at %s", self._index_path)
            return False

        self._index_service = FaissIndexService.load(
            index_path=self._index_path,
            metadata_path=self._metadata_path,
        )
        logger.info(
            "FAISS index loaded: size=%d, loaded=%s",
            self._index_service.size,
            self._index_service.is_built,
        )
        return True

    @property
    def is_index_loaded(self) -> bool:
        """Whether a FAISS index is available for search."""
        return self._index_service is not None and self._index_service.is_built

    # ------------------------------------------------------------------
    # Embedding
    # ------------------------------------------------------------------

    def embed_query(self, query: str) -> list[float]:
        """
        Generate an embedding vector for a query string.

        Args:
            query: The user's question.

        Returns:
            A list of floats representing the query embedding.
        """
        if not query or not query.strip():
            logger.warning("Cannot embed empty query")
            return []

        logger.info("Generating embedding for query: '%s'", query[:80])
        vectors = self._embed_service._embed_texts([query.strip()])
        if not vectors or not vectors[0]:
            logger.error("Embedding returned empty vector for query")
            return []

        logger.info(
            "Embedding generated: dimension=%d",
            len(vectors[0]),
        )
        return vectors[0]

    # ------------------------------------------------------------------
    # Query normalization & synonym expansion
    # ------------------------------------------------------------------

    def _normalize_query(self, query: str) -> str:
        """
        Normalize the query and expand with legal synonyms.

        Steps:
            1. Lowercase and strip.
            2. Tokenize into words.
            3. For each token, if it has a known synonym list, append
               those synonyms to the query to improve semantic overlap.
            4. Return the expanded query string.

        Args:
            query: The raw user query.

        Returns:
            An expanded query string.
        """
        normalized = query.strip().lower()
        tokens = re.findall(r"[a-zA-Z]+", normalized)
        expanded_tokens = list(tokens)
        for token in tokens:
            synonyms = SYNONYM_MAP.get(token, [])
            if not synonyms and token.endswith("s"):
                synonyms = SYNONYM_MAP.get(token[:-1], [])
            for syn in synonyms:
                if syn not in expanded_tokens:
                    expanded_tokens.append(syn)

        expanded = " ".join(expanded_tokens)

        if expanded != normalized:
            logger.debug(
                "Query expanded: '%s' -> '%s' (%d -> %d tokens)",
                normalized[:60],
                expanded[:120],
                len(tokens),
                len(expanded_tokens),
            )

        return expanded

    # ------------------------------------------------------------------
    # Keyword search
    # ------------------------------------------------------------------

    def _keyword_search(
        self,
        query: str,
        top_k: int = 5,
        metadata_filter: dict | None = None,
    ) -> list[SearchResult]:
        """
        Search chunk texts for keyword matches.

        Scores each chunk by the number of distinct query terms that
        appear in its text (case-insensitive).  This catches chunks
        that share vocabulary with the query but may be missed by
        pure semantic search.

        Args:
            query: The normalized/expanded query string.
            top_k: Maximum results to return.
            metadata_filter: Optional dict of {key: value} to restrict
                             results to chunks matching those metadata values.

        Returns:
            List of SearchResult objects ordered by descending keyword score.
        """
        if not self._index_service:
            logger.warning("Keyword search skipped: no index loaded")
            return []

        terms = [
            t for t in re.findall(r"[a-zA-Z]+", query.lower())
            if len(t) > 2
        ]
        if not terms:
            return []

        scored: list[tuple[int, SearchResult, int]] = []

        for idx in range(self._index_service._index.ntotal):
            meta = self._index_service._metadata_list[idx]

            if metadata_filter:
                if not all(meta.get(k) == v for k, v in metadata_filter.items()):
                    continue

            text = (self._index_service._chunk_texts[idx] or "").lower()
            match_count = sum(1 for t in terms if t in text)

            if match_count > 0:
                scored.append((
                    -match_count,
                    SearchResult(
                        chunk_id=self._index_service._chunk_ids[idx],
                        document_id=self._index_service._document_ids[idx],
                        chunk_text=self._index_service._chunk_texts[idx],
                        score=float(match_count) / max(len(terms), 1),
                        metadata=meta,
                    ),
                    idx,
                ))

        scored.sort(key=lambda x: x[0])
        results = [s[1] for s in scored[:top_k]]

        if results:
            logger.debug(
                "Keyword search: query='%s', terms=%s, matched=%d, top_score=%.3f, top_chunk=%.80s",
                query[:60],
                terms[:10],
                len(results),
                results[0].score,
                results[0].chunk_text[:80],
            )

        return results

    # ------------------------------------------------------------------
    # Hybrid retrieval
    # ------------------------------------------------------------------

    def _hybrid_retrieve(
        self,
        query: str,
        top_k: int = 5,
        metadata_filter: dict | None = None,
    ) -> list[SearchResult]:
        """
        Run hybrid retrieval: semantic search + keyword search.

        Steps:
            1. Generate a query embedding from the expanded query.
            2. Run FAISS semantic search.
            3. Run keyword search on the original query tokens.
            4. Merge both result sets, deduplicate by chunk_id.
            5. Rank: results in both sets rank highest, then
               semantic-only, then keyword-only.
            6. Return top-k results.

        Args:
            query: The user query (will be normalized internally).
            top_k: Number of results to return.
            metadata_filter: Optional metadata filter for FAISS search.

        Returns:
            List of SearchResult objects ordered by combined relevance.
        """
        expanded = self._normalize_query(query)
        logger.info(
            "Hybrid retrieve: original='%s', expanded='%s'",
            query[:80],
            expanded[:120],
        )

        # --- Step 1: Semantic search ---
        query_vector = self.embed_query(expanded)
        if not query_vector:
            logger.error("Query embedding failed, returning empty results")
            return []

        index_dim = self._index_service._index.d if self._index_service._index else 0
        query_dim = len(query_vector)
        if index_dim != query_dim:
            logger.error(
                "Dimension mismatch: query=%d, index=%d. "
                "The FAISS index was built with a different embedding model. "
                "Upload a new document to rebuild the index.",
                query_dim,
                index_dim,
            )
            return []

        semantic_candidates = self._index_service.search(
            query_vector,
            top_k=top_k,
            metadata_filter=metadata_filter,
        )

        logger.info(
            "Semantic search: query='%s', retrieved=%d",
            query[:80],
            len(semantic_candidates),
        )
        for i, r in enumerate(semantic_candidates):
            logger.info(
                "  semantic[%d] score=%.4f document_id=%s filename=%s chunk_id=%s",
                i,
                r.score,
                r.document_id,
                r.metadata.get("filename", "unknown") if r.metadata else "unknown",
                r.chunk_id[:8],
            )

        # --- Step 2: Keyword search (use expanded query terms) ---
        keyword_candidates = self._keyword_search(
            expanded,
            top_k=top_k,
            metadata_filter=metadata_filter,
        )

        logger.info(
            "Keyword search: query='%s', retrieved=%d",
            query[:80],
            len(keyword_candidates),
        )
        for i, r in enumerate(keyword_candidates):
            logger.info(
                "  keyword[%d] score=%.3f document_id=%s filename=%s chunk_id=%s",
                i,
                r.score,
                r.document_id,
                r.metadata.get("filename", "unknown") if r.metadata else "unknown",
                r.chunk_id[:8],
            )

        # --- Step 3: Merge + deduplicate ---
        seen_chunk_ids: set[str] = set()
        merged: list[SearchResult] = []

        semantic_by_id = {r.chunk_id: r for r in semantic_candidates}
        keyword_by_id = {r.chunk_id: r for r in keyword_candidates}
        all_ids = list(semantic_by_id.keys()) + [
            k for k in keyword_by_id if k not in semantic_by_id
        ]

        for chunk_id in all_ids:
            in_semantic = chunk_id in semantic_by_id
            in_keyword = chunk_id in keyword_by_id
            sem = semantic_by_id.get(chunk_id)
            kw = keyword_by_id.get(chunk_id)

            if in_semantic and in_keyword:
                r = SearchResult(
                    chunk_id=sem.chunk_id,
                    document_id=sem.document_id,
                    chunk_text=sem.chunk_text,
                    score=sem.score + 0.3,
                    metadata=sem.metadata,
                )
            elif in_semantic:
                r = SearchResult(
                    chunk_id=sem.chunk_id,
                    document_id=sem.document_id,
                    chunk_text=sem.chunk_text,
                    score=sem.score,
                    metadata=sem.metadata,
                )
            else:
                r = SearchResult(
                    chunk_id=kw.chunk_id,
                    document_id=kw.document_id,
                    chunk_text=kw.chunk_text,
                    score=0.5 + kw.score * 0.3,
                    metadata=kw.metadata,
                )

            merged.append(r)

        merged.sort(key=lambda x: x.score, reverse=True)
        results = merged[:top_k]

        logger.info(
            "Hybrid merge: semantic=%d, keyword=%d, merged=%d, final=%d",
            len(semantic_candidates),
            len(keyword_candidates),
            len(merged),
            len(results),
        )
        for i, r in enumerate(results):
            seen = []
            if r.chunk_id in semantic_by_id:
                seen.append("sem")
            if r.chunk_id in keyword_by_id:
                seen.append("kw")
            logger.info(
                "  final[%d] score=%.4f (%s) document_id=%s filename=%s",
                i,
                r.score,
                "+".join(seen),
                r.document_id,
                r.metadata.get("filename", "unknown") if r.metadata else "unknown",
            )

        return results

    # ------------------------------------------------------------------
    # Retrieval
    # ------------------------------------------------------------------

    def retrieve(
        self,
        query: str,
        top_k: int | None = None,
        metadata_filter: dict | None = None,
    ) -> RetrievalResult:
        """
        Retrieve the top-k most relevant chunks for a query.

        Steps:
            1. Validate the query.
            2. Run hybrid retrieval (semantic + keyword).
            3. Format the results into a context string.

        Args:
            query: The user's question.
            top_k: Override the default top-k for this call.
            metadata_filter: Optional dict of {key: value} to restrict
                             results to chunks matching those metadata values.

        Returns:
            A RetrievalResult with results and formatted context.
        """
        if not query or not query.strip():
            logger.warning("Empty query provided to retrieve")
            return RetrievalResult(query=query, results=[], context="")

        if not self.is_index_loaded:
            logger.warning("No FAISS index available for retrieval")
            return RetrievalResult(query=query, results=[], context="")

        k = top_k or self._top_k
        results = self._hybrid_retrieve(query, top_k=k, metadata_filter=metadata_filter)

        context = self.format_context(results)

        logger.info(
            "Retrieval complete: query='%s', results=%d, context_len=%d chars",
            query[:80],
            len(results),
            len(context),
        )
        if results:
            logger.debug(
                "Top result: score=%.4f, chunk_text=%.200s",
                results[0].score,
                results[0].chunk_text[:200].replace("\n", " "),
            )

        return RetrievalResult(query=query, results=results, context=context)

    # ------------------------------------------------------------------
    # Context formatting
    # ------------------------------------------------------------------

    @staticmethod
    def format_context(results: list[SearchResult]) -> str:
        """
        Format a list of SearchResult objects into a context string.

        Each result is rendered as::

            [Source 1] (score: 0.95) — filename.txt (Partition)
            The chunk text content...

        Args:
            results: List of SearchResult objects.

        Returns:
            A single formatted string, or empty string if results is empty.
        """
        if not results:
            return ""

        parts: list[str] = []
        for i, r in enumerate(results, 1):
            header = f"[Source {i}] (score: {r.score:.3f})"
            filename = r.metadata.get("filename", "")
            partition = r.metadata.get("partition", "")
            if filename and partition:
                header += f" \u2014 {filename} ({partition})"
            elif filename:
                header += f" \u2014 {filename}"
            text = r.chunk_text or f"[chunk_id: {r.chunk_id}]"
            parts.append(f"{header}\n{text}")

        return "\n\n".join(parts)
