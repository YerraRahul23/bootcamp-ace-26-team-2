from pathlib import Path
from collections import Counter

from app.core.config import settings
from app.services.document_loader import DocumentLoader


def main():
    dataset_path = Path(settings.CUAD_DATASET_PATH)

    print("Loading CUAD dataset...\n")

    loader = DocumentLoader(dataset_path)
    documents = loader.load_all()

    partitions = Counter(doc.partition for doc in documents)

    print(f"Part_I   : {partitions.get('Part_I', 0)}")
    print(f"Part_II  : {partitions.get('Part_II', 0)}")
    print(f"Part_III : {partitions.get('Part_III', 0)}")

    print("-" * 30)
    print(f"Total    : {len(documents)}")

    if len(documents) == 516:
        print("\n✅ Dataset Loaded Successfully")
    else:
        print("\n❌ Dataset Load Failed")


if __name__ == "__main__":
    main()