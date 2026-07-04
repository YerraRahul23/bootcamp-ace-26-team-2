"""
Manual verification script for the Chunk Service.

Run:

    cd backend
    source .venv/bin/activate
    python -m tests.verify_chunk_service
"""

from pathlib import Path
from collections import Counter

from app.core.config import settings
from app.services.document_loader import DocumentLoader
from app.services.chunk_service import ChunkService


def main():
    print("=" * 70)
    print("           LEGAL CONTRACT Q&A ASSISTANT")
    print("           Document Chunking Verification")
    print("=" * 70)

    # -----------------------------
    # Load Documents
    # -----------------------------
    print("\nLoading CUAD dataset...\n")

    dataset_path = Path(settings.CUAD_DATASET_PATH)

    loader = DocumentLoader(dataset_path)
    documents = loader.load_all()

    # Count documents by partition
    partitions = Counter(doc.partition for doc in documents)

    print(f"Part_I Documents   : {partitions.get('Part_I', 0)}")
    print(f"Part_II Documents  : {partitions.get('Part_II', 0)}")
    print(f"Part_III Documents : {partitions.get('Part_III', 0)}")
    print("-" * 70)
    print(f"Total Documents    : {len(documents)}")

    # -----------------------------
    # Chunk Documents
    # -----------------------------
    print("\nChunking documents...\n")

    chunk_service = ChunkService(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
    )

    chunks = chunk_service.chunk_documents(documents)

    total_chunks = len(chunks)

    avg_chunks = (
        total_chunks / len(documents)
        if documents
        else 0
    )

    print(f"Chunks Created          : {total_chunks}")
    print(f"Average Chunks/Document : {avg_chunks:.2f}")
    print(f"Chunk Size              : {settings.CHUNK_SIZE}")
    print(f"Chunk Overlap           : {settings.CHUNK_OVERLAP}")

    # -----------------------------
    # First Chunk Preview
    # -----------------------------
    if chunks:

        first = chunks[0]

        print("\n" + "=" * 70)
        print("FIRST CHUNK PREVIEW")
        print("=" * 70)

        print(f"Chunk ID      : {first.id}")
        print(f"Document ID   : {first.document_id}")
        print(f"Chunk Index   : {first.chunk_index}")
        print(f"Text Length   : {len(first.text)}")

        print("\nMetadata")

        if isinstance(first.metadata, dict):
            for key, value in first.metadata.items():
                print(f"  {key:<18}: {value}")
        else:
            print(first.metadata)

        print("\nChunk Preview")
        print("-" * 70)
        preview = first.text[:500]

        print(preview)

        if len(first.text) > 500:
            print("...")

    # -----------------------------
    # Final Summary
    # -----------------------------
    print("\n" + "=" * 70)
    print("VERIFICATION SUMMARY")
    print("=" * 70)

    print(f"Documents Loaded : {len(documents)}")
    print(f"Chunks Created   : {total_chunks}")

    if len(documents) == 516:
        print("Dataset Check    : PASSED")
    else:
        print("Dataset Check    : FAILED")

    if total_chunks > len(documents):
        print("Chunking Check   : PASSED")
    else:
        print("Chunking Check   : FAILED")

    print("\n✅ Chunking Completed Successfully")


if __name__ == "__main__":
    main()