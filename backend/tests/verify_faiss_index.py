"""
Manual verification script for the FAISS Index Service.

Run:

    cd backend
    source .venv/bin/activate
    python -m tests.verify_faiss_index
"""

import uuid
import tempfile
from pathlib import Path

from app.models.embedding import Embedding
from app.services.faiss_index_service import FaissIndexService


def make_embedding(vector: list[float], **overrides) -> Embedding:
    """Create a synthetic Embedding for testing."""
    fields = {
        "id": str(uuid.uuid4()),
        "chunk_id": str(uuid.uuid4()),
        "document_id": str(uuid.uuid4()),
        "vector": vector,
        "metadata": {"filename": "test.txt", "partition": "Part_I"},
    }
    fields.update(overrides)
    return Embedding(**fields)


def main():
    print("=" * 70)
    print("           LEGAL CONTRACT Q&A ASSISTANT")
    print("           FAISS Index Verification")
    print("=" * 70)

    # --------------------------------------------------
    # Create synthetic embeddings
    # --------------------------------------------------
    print("\nCreating synthetic embeddings...\n")

    embeddings = [
        make_embedding([1.0, 0.0, 0.0, 0.0], metadata={"filename": "a.txt", "clause": "confidentiality"}),
        make_embedding([0.0, 1.0, 0.0, 0.0], metadata={"filename": "b.txt", "clause": "indemnification"}),
        make_embedding([0.0, 0.0, 1.0, 0.0], metadata={"filename": "c.txt", "clause": "termination"}),
    ]

    print(f"Embeddings Created : {len(embeddings)}")
    print(f"Vector Dimension   : {len(embeddings[0].vector)}")

    # --------------------------------------------------
    # Build index
    # --------------------------------------------------
    print("\nBuilding FAISS index...\n")

    service = FaissIndexService()
    service.build_index(embeddings)

    print(f"Index Size         : {service.size}")
    print(f"Index Built        : {service.is_built}")

    # --------------------------------------------------
    # Save and load
    # --------------------------------------------------
    print("\nSaving and reloading index...\n")

    with tempfile.TemporaryDirectory() as tmp:
        index_path = Path(tmp) / "index.faiss"
        metadata_path = Path(tmp) / "metadata.pkl"

        svc = FaissIndexService(index_path=index_path, metadata_path=metadata_path)
        svc.build_index(embeddings)
        svc.save()

        loaded = FaissIndexService.load(index_path=index_path, metadata_path=metadata_path)
        print(f"Reloaded Size      : {loaded.size}")

        # --------------------------------------------------
        # Search
        # --------------------------------------------------
        print("\n" + "=" * 70)
        print("SEARCH RESULTS")
        print("=" * 70)

        query = [0.8, 0.1, 0.0, 0.0]
        results = loaded.search(query, top_k=3)

        print(f"\nQuery Vector       : {query}")
        print(f"Results Returned   : {len(results)}\n")

        for i, r in enumerate(results):
            print(f"  [{i}] Score        : {r.score:.4f}")
            print(f"      Chunk ID     : {r.chunk_id}")
            print(f"      Document ID  : {r.document_id}")
            print(f"      Metadata     : {r.metadata}")
            print()

        # --------------------------------------------------
        # Verification summary
        # --------------------------------------------------
        print("=" * 70)
        print("VERIFICATION SUMMARY")
        print("=" * 70)

        checks_passed = True

        if results and results[0].chunk_id == embeddings[0].chunk_id:
            print("Most Similar Check : PASSED")
        else:
            print("Most Similar Check : FAILED")
            checks_passed = False

        if len(results) == 3:
            print("Top-K Check        : PASSED")
        else:
            print("Top-K Check        : FAILED")
            checks_passed = False

        if loaded.size == 3:
            print("Size Check         : PASSED")
        else:
            print("Size Check         : FAILED")
            checks_passed = False

        if checks_passed:
            print("\n✅ FAISS Index Verification Completed Successfully")
        else:
            print("\n❌ FAISS Index Verification FAILED")


if __name__ == "__main__":
    main()
