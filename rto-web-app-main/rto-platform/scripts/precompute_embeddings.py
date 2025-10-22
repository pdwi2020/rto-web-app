#!/usr/bin/env python3
"""
Precompute embeddings for the Tamil Nadu RTO knowledge base.

Usage:
    python3 scripts/precompute_embeddings.py
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ai_services.rag_retriever import get_knowledge_base  # noqa: E402


def main() -> None:
    kb = get_knowledge_base()
    if kb.doc_embeddings is None:
        raise RuntimeError("Knowledge base embeddings unavailable; ensure vectorizer or transformer loaded.")

    method = getattr(kb, "embedding_method", "none")
    if method == "sentence_transformer":
        kb._save_embeddings_to_disk()
        print(f"Saved {kb.doc_embeddings.shape[0]} transformer embeddings to {kb.embeddings_path}")
    elif method == "tfidf":
        kb._save_tfidf_to_disk()
        print(f"Saved TF-IDF embeddings ({kb.doc_embeddings.shape[0]}) to {kb.embeddings_path}")
        if getattr(kb, 'vectorizer_path', None):
            print(f"Vectorizer cached at {kb.vectorizer_path}")
    else:
        raise RuntimeError("No embedding method active; cannot persist embeddings.")


if __name__ == "__main__":
    main()
