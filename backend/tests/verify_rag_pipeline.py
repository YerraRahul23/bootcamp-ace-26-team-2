"""
Manual verification script for the RAG Pipeline.

Runs the full RAG pipeline end-to-end:
1. Retrieves relevant context from the FAISS index.
2. Builds a prompt with system instructions.
3. Invokes Gemini to generate an answer.
4. Displays results.

Requires:
- GEMINI_API_KEY set in .env or environment.
- FAISS index built and saved (run verify_faiss_index first).

Run:

    cd backend
    source .venv/bin/activate
    python -m tests.verify_rag_pipeline
"""

from app.services.rag_pipeline_service import RAGPipelineService


def main():
    print("=" * 70)
    print("           LEGAL CONTRACT Q&A ASSISTANT")
    print("           RAG Pipeline Verification")
    print("=" * 70)

    # --------------------------------------------------
    # Initialize RAG Pipeline
    # --------------------------------------------------
    print("\nInitializing RAG pipeline...\n")

    service = RAGPipelineService()

    if not service._retrieval.is_index_loaded:
        print("⚠️  FAISS index not found. Pipeline will run without retrieval context.")
        print("   Run  python -m tests.verify_faiss_index  first for full verification.\n")

    # --------------------------------------------------
    # Run sample query
    # --------------------------------------------------
    print("=" * 70)
    print("SAMPLE QUERY")
    print("=" * 70)

    query = "What are the confidentiality obligations in this contract?"
    print(f"\nQuery : {query}\n")

    result = service.answer(query)

    # --------------------------------------------------
    # Retrieved context
    # --------------------------------------------------
    print("-" * 70)
    print("RETRIEVED CONTEXT")
    print("-" * 70)

    if result.context:
        print()
        print(result.context)
        print()
    else:
        print("\n  (No context retrieved)\n")

    # --------------------------------------------------
    # Generated answer
    # --------------------------------------------------
    print("-" * 70)
    print("GENERATED ANSWER")
    print("-" * 70)

    print(f"\n{result.answer}\n")

    # --------------------------------------------------
    # Sources
    # --------------------------------------------------
    print("-" * 70)
    print("SOURCES")
    print("-" * 70)

    if result.sources:
        for i, source in enumerate(result.sources):
            print(f"\n  [{i}] Score       : {source.score:.4f}")
            print(f"      Chunk ID    : {source.chunk_id}")
            print(f"      Document ID : {source.document_id}")
            filename = source.metadata.get("filename", "?")
            partition = source.metadata.get("partition", "?")
            print(f"      File        : {filename} ({partition})")
    else:
        print("\n  (No sources)\n")

    # --------------------------------------------------
    # Verification summary
    # --------------------------------------------------
    print("=" * 70)
    print("VERIFICATION SUMMARY")
    print("=" * 70)

    checks_passed = True

    if result.answer and "error" not in result.answer.lower():
        print("Answer Generated  : PASSED")
    else:
        print("Answer Generated  : FAILED")
        checks_passed = False

    if result.model:
        print(f"Model Used        : {result.model}")
    else:
        print("Model Used        : FAILED")
        checks_passed = False

    if result.sources:
        print(f"Sources Retrieved : {len(result.sources)}")
    else:
        print("Sources Retrieved : 0 (no FAISS index loaded)")

    print(f"Answer Length     : {len(result.answer)} chars")

    if checks_passed:
        print("\n✅ RAG Pipeline Verification Completed Successfully")
    else:
        print("\n❌ RAG Pipeline Verification FAILED")


if __name__ == "__main__":
    main()
