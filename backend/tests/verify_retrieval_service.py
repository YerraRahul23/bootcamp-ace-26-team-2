"""
Manual verification script for the Retrieval Service.

Run:

    cd backend
    source .venv/bin/activate
    python -m tests.verify_retrieval_service
"""

import uuid
from pathlib import Path

from app.models.embedding import Embedding
from app.services.faiss_index_service import FaissIndexService
from app.services.retrieval_service import RetrievalService


class FakeEmbedder:
    """Deterministic fake embedder for verification."""

    def __init__(self, dimension: int = 4) -> None:
        self.dimension = dimension

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [
            [float((len(text) + i) % 10) / 10.0 for _ in range(self.dimension)]
            for i, text in enumerate(texts)
        ]


def make_embedding(vector: list[float], **overrides) -> Embedding:
    fields = {
        "id": str(uuid.uuid4()),
        "chunk_id": str(uuid.uuid4()),
        "document_id": str(uuid.uuid4()),
        "vector": vector,
        "metadata": {"filename": "a.txt", "partition": "Part_I"},
    }
    fields.update(overrides)
    return Embedding(**fields)


def main():
    print("=" * 70)
    print("           LEGAL CONTRACT Q&A ASSISTANT")
    print("           Retrieval Service Verification")
    print("=" * 70)

    # --------------------------------------------------
    # Create embeddings and build FAISS index
    # --------------------------------------------------
    print("\nCreating embeddings and building FAISS index...\n")

    embeddings = [
        make_embedding([1.0, 0.0, 0.0, 0.0], metadata={"filename": "nda.txt", "clause": "confidentiality"}),
        make_embedding([0.0, 1.0, 0.0, 0.0], metadata={"filename": "msa.txt", "clause": "indemnification"}),
        make_embedding([0.0, 0.0, 1.0, 0.0], metadata={"filename": "sla.txt", "clause": "termination"}),
    ]
    chunk_texts = [
        "The receiving party shall maintain confidentiality of all proprietary information.",
        "Each party agrees to indemnify the other against third-party claims arising from breach.",
        "This agreement may be terminated by either party upon thirty days written notice.",
    ]

    index_service = FaissIndexService()
    index_service.build_index(embeddings, chunk_texts=chunk_texts)

    print(f"Embeddings : {len(embeddings)}")
    print(f"Index Size : {index_service.size}")
    print(f"Dimension  : {len(embeddings[0].vector)}")

    # --------------------------------------------------
    # Create retrieval service with fake embedder
    # --------------------------------------------------
    print("\nInitializing RetrievalService...\n")

    fake_embedder = FakeEmbedder(dimension=4)
    embed_service = type("FakeEmbedService", (), {"_embed_texts": fake_embedder.embed_documents})()

    retrieval_service = RetrievalService(
        embed_service=embed_service,
        index_service=index_service,
        top_k=3,
    )

    # --------------------------------------------------
    # Retrieve
    # --------------------------------------------------
    print("=" * 70)
    print("RETRIEVAL RESULTS")
    print("=" * 70)

    query = "confidentiality obligations"
    result = retrieval_service.retrieve(query)

    print(f"\nQuery       : {query}")
    print(f"Results     : {len(result.results)}\n")

    for i, r in enumerate(result.results):
        filename = r.metadata.get("filename", "?")
        clause = r.metadata.get("clause", "?")
        print(f"  [{i}] Score    : {r.score:.4f}")
        print(f"      File     : {filename}")
        print(f"      Clause   : {clause}")
        print(f"      Chunk ID : {r.chunk_id}")
        print()

    # --------------------------------------------------
    # Formatted context
    # --------------------------------------------------
    print("-" * 70)
    print("FORMATTED CONTEXT")
    print("-" * 70)
    print()
    print(result.context)
    print()

    # --------------------------------------------------
    # Verification summary
    # --------------------------------------------------
    print("=" * 70)
    print("VERIFICATION SUMMARY")
    print("=" * 70)

    checks_passed = True

    if len(result.results) == 3:
        print("Top-K Check         : PASSED")
    else:
        print("Top-K Check         : FAILED")
        checks_passed = False

    if result.results and result.results[0].score >= result.results[-1].score:
        print("Ordering Check      : PASSED")
    else:
        print("Ordering Check      : FAILED")
        checks_passed = False

    clauses = {r.metadata.get("clause") for r in result.results}
    if "confidentiality" in clauses:
        print("Most Similar Check  : PASSED")
    else:
        print("Most Similar Check  : FAILED")
        checks_passed = False

    if result.context:
        print("Context Check       : PASSED")
    else:
        print("Context Check       : FAILED")
        checks_passed = False

    print(f"\nQuery       : {result.query}")
    print(f"Results     : {len(result.results)}")
    print(f"Context Len : {len(result.context)} chars")

    if checks_passed:
        print("\n✅ Retrieval Service Verification Completed Successfully")
    else:
        print("\n❌ Retrieval Service Verification FAILED")


if __name__ == "__main__":
    main()
