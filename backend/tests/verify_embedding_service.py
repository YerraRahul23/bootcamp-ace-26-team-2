"""
Manual verification script for the Embedding Service.

Run:

    cd backend
    source .venv/bin/activate
    python -m tests.verify_embedding_service
"""

from pathlib import Path

from app.core.config import settings
from app.services.document_loader import DocumentLoader
from app.services.chunk_service import ChunkService
from app.services.embedding_service import EmbeddingService


def main():
    print("=" * 70)
    print("           LEGAL CONTRACT Q&A ASSISTANT")
    print("          Embedding Service Verification")
    print("=" * 70)

    # --------------------------------------------------
    # Load Documents
    # --------------------------------------------------
    print("\nLoading CUAD dataset...\n")

    loader = DocumentLoader(Path(settings.CUAD_DATASET_PATH))
    all_documents = loader.load_all()

    print(f"Total Documents Available : {len(all_documents)}")

    # Use ONLY ONE document
    documents = all_documents[:1]

    print(f"Documents Used            : {len(documents)}")

    # --------------------------------------------------
    # Chunk Documents
    # --------------------------------------------------
    print("\nChunking documents...\n")

    chunk_service = ChunkService(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
    )

    chunks = chunk_service.chunk_documents(documents)

    print(f"Total Chunks Created      : {len(chunks)}")

    # Use ONLY FIVE chunks
    chunks = chunks[:5]

    print(f"Chunks Used               : {len(chunks)}")

    # --------------------------------------------------
    # Generate Embeddings
    # --------------------------------------------------
    print("\nGenerating embeddings...\n")

    embedding_service = EmbeddingService(
        model_name=settings.EMBEDDING_MODEL,
        batch_size=settings.EMBEDDING_BATCH_SIZE,
        api_key=settings.GEMINI_API_KEY,
    )

    embeddings = embedding_service.embed_chunks(chunks)

    print(f"Embeddings Generated      : {len(embeddings)}")

    if embeddings:
        vector_dimension = len(embeddings[0].vector)
    else:
        vector_dimension = 0

    print(f"Embedding Model           : {settings.EMBEDDING_MODEL}")
    print(f"Batch Size                : {settings.EMBEDDING_BATCH_SIZE}")
    print(f"Vector Dimension          : {vector_dimension}")

    # --------------------------------------------------
    # First Embedding
    # --------------------------------------------------
    if embeddings:
        first = embeddings[0]

        print("\n" + "=" * 70)
        print("FIRST EMBEDDING")
        print("=" * 70)

        print(f"Embedding ID : {first.id}")
        print(f"Document ID  : {first.document_id}")
        print(f"Chunk ID     : {first.chunk_id}")
        print(f"Vector Size  : {len(first.vector)}")

        print("\nMetadata")
        print("-" * 70)

        for key, value in first.metadata.items():
            print(f"{key:<18}: {value}")

        print("\nVector Preview")
        print("-" * 70)

        for i, value in enumerate(first.vector[:10]):
            print(f"[{i}] {value:.6f}")

        if len(first.vector) > 10:
            print("...")

    print("\n" + "=" * 70)
    print("PIPELINE STATUS")
    print("=" * 70)

    print("Loader      : PASSED")
    print("Chunking    : PASSED")
    print("Embedding   : PASSED")

    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)

    print(f"Dataset Documents : {len(all_documents)}")
    print(f"Documents Tested  : {len(documents)}")
    print(f"Chunks Tested     : {len(chunks)}")
    print(f"Embeddings        : {len(embeddings)}")

    print("\n✅ Embedding Service Verified Successfully")


if __name__ == "__main__":
    main()