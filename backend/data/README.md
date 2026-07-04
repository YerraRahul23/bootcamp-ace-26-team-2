# CUAD v1 — Contract Understanding Atticus Dataset

## Dataset Name

**CUAD v1** (Contract Understanding Atticus Dataset)

## Dataset Source

- **Original project:** [Atticus Project](https://www.atticusprojectai.org/cuad)
- **Hugging Face:** [theatticusproject/cuad](https://huggingface.co/datasets/theatticusproject/cuad)
- **License:** CUAD is released under the CUAD Data License Agreement (see `metadata/CUAD v1 ReadMe _ Datasheet/` for details).

## Dataset Overview

| Property | Value |
|---|---|
| Number of contracts | 516 |
| Number of clause types | 41 |
| Annotation format | SQuAD 2.0-style JSON |
| Contract format | Plain text (.txt) |

## Directory Structure

```
data/CUAD/
├── contracts/           # 516 contract text files for chunking & retrieval
│   ├── Part_I/          #   225 contracts
│   ├── Part_II/         #   161 contracts
│   └── Part_III/        #   130 contracts
├── annotations/         # Ground-truth QA labels for evaluation
│   └── CUAD_v1.json     #   ~40 MB, SQuAD 2.0 format
├── metadata/            # Supporting data and documentation
│   ├── master_clauses.csv
│   ├── master_clauses.xlsx
│   ├── label_group_xlsx/         # 28 clause-group Excel files
│   ├── CUAD v1 ReadMe _ Datasheet/  # Original datasheet PDF + README
│   └── DATASET.md
└── README.md            # This file
```

### contracts/

Contains 516 plain-text contract documents split across three parts. Each file preserves the original filename from the CUAD distribution. These files will serve as the raw input for **Phase 2 (Document Loader)** and **Phase 3 (Chunking)** of the RAG pipeline.

### annotations/

`CUAD_v1.json` follows the SQuAD 2.0 schema. Each contract is divided into paragraphs, and each paragraph may have one or more question-answer pairs for the 41 clause categories. This file will be used in **Phase 6 (Evaluation)** to measure retrieval and answer accuracy.

### metadata/

- **master_clauses.csv / .xlsx** — 510 contract rows with 83 columns (41 clause categories each with a context column and an answer column). Useful for understanding label distributions and clause coverage.
- **label_group_xlsx/** — 28 Excel files, one per clause group, providing detailed annotation views.
- **CUAD v1 ReadMe _ Datasheet/** — Original dataset documentation, including the datasheet and usage terms.
- **DATASET.md** — Original dataset description from the CUAD distribution.

## How This Feeds Into the RAG Pipeline

| Phase | Component | Data Used |
|---|---|---|
| Phase 2 | Document Loader | `contracts/` — loads .txt files for processing |
| Phase 3 | Chunking | `contracts/` — splits documents into passages |
| Phase 4 | Embeddings | Output of chunking — generates vector representations |
| Phase 5 | FAISS Index | Output of embeddings — builds search index |
| Phase 6 | Evaluation | `annotations/CUAD_v1.json` — measures retrieval & QA accuracy |

## Clause Types (41)

1. Document Name
2. Parties
3. Agreement Date
4. Effective Date
5. Expiration Date
6. Renewal Term
7. Notice Period To Terminate Renewal
8. Governing Law
9. Most Favored Nation
10. Competitive Restriction Exception
11. Non-Compete
12. Exclusivity
13. No-Solicit Of Customers
14. No-Solicit Of Employees
15. Non-Disparagement
16. Termination For Convenience
17. ROFR/ROFO/ROFN
18. Change Of Control
19. Anti-Assignment
20. Revenue/Profit Sharing
21. Price Restrictions
22. Minimum Commitment
23. Volume Restriction
24. IP Ownership Assignment
25. Joint IP Ownership
26. License Grant
27. Non-Transferable License
28. Affiliate License-Licensor
29. Affiliate License-Licensee
30. Unlimited/All-You-Can-Eat License
31. Irrevocable Or Perpetual License
32. Source Code Escrow
33. Post-Termination Services
34. Audit Rights
35. Uncapped Liability
36. Cap On Liability
37. Liquidated Damages
38. Warranty Duration
39. Insurance
40. Covenant Not To Sue
41. Third Party Beneficiary
