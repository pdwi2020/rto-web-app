"""
RAG-IVR: Retrieval-Augmented Generation with Evidence Linking
Implements hybrid retrieval (BM25 + Dense vectors) for RTO knowledge base
"""

from typing import List, Dict, Optional
import json
import logging
import os
import pickle
import re
from collections import Counter
from pathlib import Path

# Optional imports
try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    SKLEARN_AVAILABLE = True
except ImportError:
    TfidfVectorizer = None  # type: ignore
    SKLEARN_AVAILABLE = False


class RTOKnowledgeBase:
    """
    RTO Domain Knowledge Base with structured information
    """

    def __init__(self, kb_path: Optional[str] = None):
        self.logger = logging.getLogger(__name__)
        self.kb_path = self._resolve_kb_path(kb_path)
        self.documents: List[Dict] = []
        self.embeddings_path = Path(__file__).resolve().parent.parent / "data" / "knowledge_embeddings.npy"
        self.vectorizer_path = Path(__file__).resolve().parent.parent / "data" / "knowledge_vectorizer.pkl"
        self.embedding_method = "none"
        self.vectorizer: Optional[TfidfVectorizer] = None
        self._load_documents()
        if not self.documents:
            self.logger.warning(
                "Knowledge base file %s missing or empty; falling back to Tamil Nadu defaults.",
                self.kb_path,
            )
            self.documents = self._default_documents()

        # Build inverted index for BM25-style retrieval
        self.inverted_index: Dict[str, List[str]] = {}
        self._build_inverted_index()

        # Initialize sentence transformer for dense retrieval
        self.embedder = None
        self.doc_embeddings = None
        if SENTENCE_TRANSFORMERS_AVAILABLE and NUMPY_AVAILABLE and self.documents:
            try:
                self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
                self.embedding_method = "sentence_transformer"
                if not self._load_embeddings_from_disk():
                    self._build_dense_index()
                    self._save_embeddings_to_disk()
            except Exception as exc:
                self.logger.warning("Sentence transformer initialisation failed: %s", exc)
                self.embedder = None
                self.embedding_method = "none"

        if (self.embedder is None or self.doc_embeddings is None) and self.documents:
            self._init_tfidf_fallback()

    def _resolve_kb_path(self, kb_path: Optional[str]) -> Path:
        if kb_path:
            candidate = Path(kb_path)
        else:
            env_path = os.getenv("RTO_KB_PATH")
            candidate = Path(env_path) if env_path else Path(__file__).resolve().parent.parent / "data" / "knowledge_base.jsonl"
        try:
            return candidate.expanduser().resolve()
        except FileNotFoundError:
            return candidate.expanduser()

    def _load_documents(self) -> None:
        docs = self._load_from_jsonl(self.kb_path)
        if docs:
            self.documents = docs

    def _load_from_jsonl(self, path: Path) -> List[Dict]:
        if not path or not path.exists():
            return []

        documents: List[Dict] = []
        with path.open(encoding="utf-8") as fh:
            for index, line in enumerate(fh, start=1):
                record = line.strip()
                if not record:
                    continue
                try:
                    payload = json.loads(record)
                except json.JSONDecodeError as exc:
                    self.logger.warning("Skipping malformed JSON (line %s): %s", index, exc)
                    continue

                doc = self._normalise_document(payload, len(documents) + 1)
                if doc:
                    documents.append(doc)

        return documents

    def _normalise_document(self, payload: Dict, fallback_idx: int) -> Optional[Dict]:
        title = payload.get("title") or payload.get("question")
        content = payload.get("content")
        if not title or not content:
            return None

        doc_id = str(payload.get("id") or f"tnkb-{fallback_idx:04d}")
        tags = payload.get("tags") or []
        if isinstance(tags, str):
            tags = [tags]
        elif isinstance(tags, list):
            tags = [t for t in tags if isinstance(t, str)]
        else:
            tags = []

        metadata = payload.get("metadata") or {}
        category = payload.get("category") or metadata.get("category") or "General"
        intent = payload.get("intent") or metadata.get("intent") or "General"

        return {
            "id": doc_id,
            "title": title,
            "content": content,
            "source": payload.get("source", "Tamil Nadu Transport Dept Knowledge Base"),
            "category": category,
            "intent": intent,
            "tags": tags or [category.lower()],
            "metadata": metadata,
        }

    def _default_documents(self) -> List[Dict]:
        return [
            {
                "id": "tn-default-001",
                "title": "Tamil Nadu Vehicle Registration Checklist",
                "content": (
                    "Question: What documents are needed for new vehicle registration in Tamil Nadu? "
                    "Answer: Provide Form 20, sale invoice, insurance, valid Pollution Under Control certificate, "
                    "and address proof. Applicable Region: Regional Transport Offices across Tamil Nadu. "
                    "This guidance covers Chennai, Coimbatore, Madurai, Tiruchirappalli, and Salem. "
                    "Includes chassis imprint and tax receipt for compliance."
                ),
                "source": "Tamil Nadu Transport Dept Quick Reference",
                "category": "Vehicle",
                "intent": "Registration",
                "tags": ["vehicle", "registration", "tamil-nadu"],
                "metadata": {"state": "Tamil Nadu"},
            },
            {
                "id": "tn-default-002",
                "title": "Tamil Nadu Duplicate RC Guidance",
                "content": (
                    "Question: How do I obtain a duplicate RC book in Tamil Nadu? "
                    "Answer: File Form 26 with a police intimation, attach insurance, emission certificate, "
                    "and Aadhaar copy, then submit via the authorised broker portal. "
                    "Includes RC book handling procedures for Chennai South RTO offices."
                ),
                "source": "Tamil Nadu Transport Dept Quick Reference",
                "category": "Document",
                "intent": "Duplicate / Document",
                "tags": ["document", "duplicate", "tamil-nadu", "rc-book"],
                "metadata": {"state": "Tamil Nadu"},
            },
            {
                "id": "tn-default-003",
                "title": "Tamil Nadu Pollution Certificate Requirements",
                "content": (
                    "Question: What are the pollution certificate requirements in Tamil Nadu? "
                    "Answer: Every vehicle must carry a valid Pollution Under Control (PUC) certificate renewed every "
                    "six months. Authorised emission centres in Tamil Nadu provide the certificate after exhaust analysis. "
                    "Keep the PUC slip handy during inspections to avoid penalties."
                ),
                "source": "Tamil Nadu Transport Dept Quick Reference",
                "category": "Vehicle",
                "intent": "Validation / Fraud",
                "tags": ["vehicle", "puc", "pollution", "tamil-nadu"],
                "metadata": {"state": "Tamil Nadu"},
            },
            {
                "id": "tn-default-004",
                "title": "Tamil Nadu Driving Licence Renewal Steps",
                "content": (
                    "Question: How do I renew a driving licence in Tamil Nadu? "
                    "Answer: Submit Form 9, recent passport photos, original DL, and medical certificate (if over 40 or "
                    "commercial) via the broker portal. Pay the renewal fee and book biometrics at the zonal RTO. "
                    "Processing typically completes within seven working days."
                ),
                "source": "Tamil Nadu Transport Dept Quick Reference",
                "category": "Licence",
                "intent": "Renewal",
                "tags": ["licence", "renewal", "tamil-nadu"],
                "metadata": {"state": "Tamil Nadu"},
            },
        ]

    def _tokenize(self, text: str) -> List[str]:
        """Simple tokenization"""
        text = text.lower()
        text = re.sub(r'[^\w\s]', ' ', text)
        tokens = text.split()
        return [t for t in tokens if len(t) > 2]  # Filter short tokens

    def _build_inverted_index(self):
        """Build inverted index for BM25 retrieval"""
        for doc in self.documents:
            # Combine title and content for indexing
            text = f"{doc['title']} {doc['content']} {' '.join(doc['tags'])}"
            tokens = self._tokenize(text)

            for token in set(tokens):  # Unique tokens
                if token not in self.inverted_index:
                    self.inverted_index[token] = []
                self.inverted_index[token].append(doc['id'])

    def _build_dense_index(self):
        """Build dense vector index using sentence transformers"""
        if not self.embedder or self.embedding_method != "sentence_transformer":
            return

        # Create embeddings for all documents
        texts = [f"{doc['title']}. {doc['content']}" for doc in self.documents]
        try:
            self.doc_embeddings = self.embedder.encode(texts, show_progress_bar=False)
        except Exception:
            self.doc_embeddings = None

    def _load_embeddings_from_disk(self) -> bool:
        if self.embedding_method != "sentence_transformer":
            return False
        if not self.embeddings_path.exists() or not NUMPY_AVAILABLE:
            return False
        try:
            embeddings = np.load(self.embeddings_path)
        except Exception as exc:
            self.logger.warning("Could not load cached embeddings: %s", exc)
            return False
        if embeddings.shape[0] != len(self.documents):
            self.logger.info(
                "Cached embeddings count %s does not match documents %s. Recomputing.",
                embeddings.shape[0],
                len(self.documents),
            )
            return False
        self.doc_embeddings = embeddings
        return True

    def _save_embeddings_to_disk(self) -> None:
        if self.embedding_method != "sentence_transformer":
            return
        if not NUMPY_AVAILABLE or self.doc_embeddings is None:
            return
        try:
            self.embeddings_path.parent.mkdir(parents=True, exist_ok=True)
            np.save(self.embeddings_path, self.doc_embeddings)
        except Exception as exc:
            self.logger.warning("Failed to cache embeddings: %s", exc)

    def _init_tfidf_fallback(self) -> None:
        if not SKLEARN_AVAILABLE or not NUMPY_AVAILABLE:
            return
        if self._load_tfidf_from_disk():
            self.embedding_method = "tfidf"
            return

        try:
            self.vectorizer = TfidfVectorizer(
                ngram_range=(1, 2),
                lowercase=True,
                max_features=5000,
            )
            texts = [f"{doc['title']} {doc['content']}" for doc in self.documents]
            matrix = self.vectorizer.fit_transform(texts)
            self.doc_embeddings = matrix.astype(float).toarray()
            self.embedding_method = "tfidf"
            self._save_tfidf_to_disk()
            self.logger.info("TF-IDF fallback embeddings generated for knowledge base.")
        except Exception as exc:
            self.logger.warning("TF-IDF fallback initialisation failed: %s", exc)
            self.vectorizer = None
            self.doc_embeddings = None
            self.embedding_method = "none"

    def _load_tfidf_from_disk(self) -> bool:
        if not self.embeddings_path.exists() or not self.vectorizer_path.exists():
            return False
        try:
            embeddings = np.load(self.embeddings_path)
            with self.vectorizer_path.open("rb") as fh:
                self.vectorizer = pickle.load(fh)
        except Exception as exc:
            self.logger.warning("Could not load cached TF-IDF embeddings: %s", exc)
            return False

        if embeddings.shape[0] != len(self.documents):
            return False

        self.doc_embeddings = embeddings
        return True

    def _save_tfidf_to_disk(self) -> None:
        if self.embedding_method != "tfidf" or self.doc_embeddings is None or self.vectorizer is None:
            return
        try:
            self.embeddings_path.parent.mkdir(parents=True, exist_ok=True)
            np.save(self.embeddings_path, self.doc_embeddings)
            with self.vectorizer_path.open("wb") as fh:
                pickle.dump(self.vectorizer, fh)
        except Exception as exc:
            self.logger.warning("Failed to cache TF-IDF embeddings: %s", exc)

    def bm25_search(self, query: str, top_k: int = 3) -> List[Dict]:
        """
        BM25-style keyword-based retrieval
        """
        query_tokens = self._tokenize(query)

        # Count query term frequencies
        query_tf = Counter(query_tokens)

        # Score each document
        doc_scores = {}
        for token in set(query_tokens):
            if token in self.inverted_index:
                # Simple TF-IDF style scoring
                idf = np.log((len(self.documents) + 1) / (len(self.inverted_index[token]) + 1)) if NUMPY_AVAILABLE else 1.0

                for doc_id in self.inverted_index[token]:
                    if doc_id not in doc_scores:
                        doc_scores[doc_id] = 0
                    doc_scores[doc_id] += query_tf[token] * idf

        # Get top-k documents
        ranked_docs = sorted(doc_scores.items(), key=lambda x: x[1], reverse=True)[:top_k]

        # Retrieve full documents
        results = []
        for doc_id, score in ranked_docs:
            doc = next((d for d in self.documents if d['id'] == doc_id), None)
            if doc:
                results.append({
                    **doc,
                    'score': float(score),
                    'method': 'bm25'
                })

        return results

    def dense_search(self, query: str, top_k: int = 3) -> List[Dict]:
        """
        Dense vector similarity search using sentence embeddings
        """
        if self.doc_embeddings is None or not NUMPY_AVAILABLE:
            return []

        if self.embedding_method == "sentence_transformer" and self.embedder is not None:
            try:
                query_embedding = self.embedder.encode([query], show_progress_bar=False)[0]
                doc_norms = np.linalg.norm(self.doc_embeddings, axis=1)
                query_norm = np.linalg.norm(query_embedding)
                doc_norms[doc_norms == 0] = 1e-9
                if query_norm == 0:
                    query_norm = 1e-9
                similarities = np.dot(self.doc_embeddings, query_embedding) / (doc_norms * query_norm)
            except Exception:
                similarities = None
        elif self.embedding_method == "tfidf" and self.vectorizer is not None:
            try:
                query_vec = self.vectorizer.transform([query]).toarray()[0]
                doc_norms = np.linalg.norm(self.doc_embeddings, axis=1)
                query_norm = np.linalg.norm(query_vec)
                doc_norms[doc_norms == 0] = 1e-9
                if query_norm == 0:
                    query_norm = 1e-9
                similarities = np.dot(self.doc_embeddings, query_vec) / (doc_norms * query_norm)
            except Exception:
                similarities = None
        else:
            similarities = None

        if similarities is None:
            fallback = self.bm25_search(query, top_k=top_k)
            for doc in fallback:
                doc['method'] = 'dense_fallback'
            return fallback

        top_indices = np.argsort(similarities)[-top_k:][::-1]

        results = []
        for idx in top_indices:
            doc = self.documents[idx].copy()
            doc['score'] = float(similarities[idx])
            doc['method'] = 'dense_vector'
            results.append(doc)

        return results

    def hybrid_search(self, query: str, top_k: int = 5, bm25_weight: float = 0.4, dense_weight: float = 0.6) -> List[Dict]:
        """
        Hybrid retrieval combining BM25 and dense vector search
        """
        # Get results from both methods
        bm25_results = self.bm25_search(query, top_k=top_k)
        dense_results = self.dense_search(query, top_k=top_k)

        # Combine and rerank
        doc_scores = {}

        # Add BM25 scores
        for doc in bm25_results:
            doc_id = doc['id']
            doc_scores[doc_id] = {
                'doc': doc,
                'score': bm25_weight * doc['score']
            }

        # Add dense scores
        for doc in dense_results:
            doc_id = doc['id']
            if doc_id in doc_scores:
                doc_scores[doc_id]['score'] += dense_weight * doc['score']
            else:
                doc_scores[doc_id] = {
                    'doc': doc,
                    'score': dense_weight * doc['score']
                }

        # Rank by combined score
        ranked = sorted(doc_scores.values(), key=lambda x: x['score'], reverse=True)[:top_k]

        results = []
        for item in ranked:
            doc = item['doc'].copy()
            doc['score'] = float(item['score'])
            doc['method'] = 'hybrid'
            results.append(doc)

        return results

    def retrieve(self, query: str, top_k: int = 3, method: str = 'hybrid') -> List[Dict]:
        """
        Main retrieval interface

        Args:
            query: Search query
            top_k: Number of documents to retrieve
            method: 'bm25', 'dense', or 'hybrid'

        Returns:
            List of relevant documents with scores
        """
        if method == 'bm25':
            return self.bm25_search(query, top_k)
        elif method == 'dense':
            return self.dense_search(query, top_k)
        else:  # hybrid
            return self.hybrid_search(query, top_k)


# Global instance
_knowledge_base = None

def get_knowledge_base() -> RTOKnowledgeBase:
    """Get or create global knowledge base instance"""
    global _knowledge_base
    if _knowledge_base is None:
        _knowledge_base = RTOKnowledgeBase()
    return _knowledge_base
