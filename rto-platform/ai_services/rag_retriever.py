"""
RAG-IVR: Retrieval-Augmented Generation with Evidence Linking
Implements hybrid retrieval (BM25 + Dense vectors) for RTO knowledge base
"""

from typing import List, Dict, Optional, Tuple
import json
import re
from collections import Counter

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


class RTOKnowledgeBase:
    """
    RTO Domain Knowledge Base with structured information
    """

    def __init__(self):
        self.documents = [
            {
                'id': 'doc001',
                'title': 'New Vehicle Registration Process',
                'category': 'registration',
                'content': 'To register a new vehicle in India, you need: 1) Invoice from dealer, 2) Insurance certificate, 3) PUC certificate, 4) Form 20 and 21, 5) ID and address proof, 6) Chassis and engine number verification. The process takes 3-5 working days. Fees vary by state and vehicle type.',
                'source': 'Parivahan Guide 2024, Page 15',
                'tags': ['registration', 'new vehicle', 'documents', 'process']
            },
            {
                'id': 'doc002',
                'title': 'Transfer of Ownership Process',
                'category': 'transfer',
                'content': 'Vehicle ownership transfer requires: 1) RC book original, 2) Form 29 and 30, 3) NOC from financer if applicable, 4) Insurance transfer, 5) Both seller and buyer ID proof, 6) Address proof. Processing time: 7-15 days depending on verification.',
                'source': 'Transport Rules Manual, Section 4.2',
                'tags': ['transfer', 'ownership', 'NOC', 'documents']
            },
            {
                'id': 'doc003',
                'title': 'License Renewal Requirements',
                'category': 'license',
                'content': 'Driving license renewal process: 1) Valid till date should not have expired more than 1 year, 2) Form 9 filled, 3) Medical certificate for commercial vehicles and age above 40, 4) Passport size photos, 5) Aadhaar card. Online renewal available for non-commercial licenses.',
                'source': 'Motor Vehicles Act Section 14',
                'tags': ['license', 'renewal', 'DL', 'medical certificate']
            },
            {
                'id': 'doc004',
                'title': 'RC Renewal and Fitness Certificate',
                'category': 'renewal',
                'content': 'RC renewal is mandatory every 15 years for two-wheelers and cars, and every 5 years for commercial vehicles. Fitness certificate required for vehicles older than 15 years. Documents needed: RC original, valid insurance, PUC certificate, Form 25.',
                'source': 'Central Motor Vehicles Rules 1989, Rule 81',
                'tags': ['RC', 'renewal', 'fitness', 'certificate']
            },
            {
                'id': 'doc005',
                'title': 'Fee Structure for RTO Services',
                'category': 'fees',
                'content': 'New Registration fees: Two Wheeler ₹1500-2000, Four Wheeler ₹3000-5000. Transfer of Ownership: ₹600-1200. License fees: Learning license ₹200-300, Permanent license ₹400-600. Renewal fees are generally 50% of new registration. Broker service charges are additional (15-25%).',
                'source': 'TN State Transport Fee Chart 2024',
                'tags': ['fees', 'charges', 'cost', 'payment']
            },
            {
                'id': 'doc006',
                'title': 'Fancy Number Plate Reservation',
                'category': 'fancy_number',
                'content': 'Fancy/VIP number plates can be reserved through online bidding. Minimum bid starts at ₹5000. Popular combinations (like 0001, 1111, etc.) can go up to lakhs in auction. Reservation must be done within 7 days of vehicle purchase.',
                'source': 'Parivahan Portal Guidelines',
                'tags': ['fancy number', 'VIP number', 'auction', 'bidding']
            },
            {
                'id': 'doc007',
                'title': 'Pollution Under Control (PUC) Certificate',
                'category': 'pucc',
                'content': 'PUC certificate is mandatory and must be renewed every 6 months. Cost: ₹60-100. Required documents: RC book. Test takes 5-10 minutes at authorized centers. Driving without valid PUC can result in fine of ₹1000-10000.',
                'source': 'Air Act 1981, Emission Norms',
                'tags': ['PUC', 'pollution', 'certificate', 'emission']
            },
            {
                'id': 'doc008',
                'title': 'Duplicate RC and DL Issuance',
                'category': 'duplicate',
                'content': 'For lost/damaged RC or DL: 1) File FIR for lost documents, 2) Fill Form 26 (RC) or Form 9 (DL), 3) Affidavit on stamp paper, 4) ID proof and address proof, 5) Photographs. Fee: ₹300-500. Processing: 7-10 days.',
                'source': 'MVA Section 11 and 16',
                'tags': ['duplicate', 'lost', 'RC', 'DL']
            },
            {
                'id': 'doc009',
                'title': 'NOC for Interstate Transfer',
                'category': 'noc',
                'content': 'NOC (No Objection Certificate) required when moving vehicle to another state. Apply at original RTO with: RC book, insurance, PUC, ID proof, new address proof. Fee: ₹100-300. Valid for 6 months. Must re-register in new state within this period.',
                'source': 'Interstate Transfer Guidelines',
                'tags': ['NOC', 'interstate', 'transfer', 'relocation']
            },
            {
                'id': 'doc010',
                'title': 'Vehicle Hypothecation and Loan Details',
                'category': 'loan',
                'content': 'When vehicle is under loan, RC will show hypothecation details. To remove after loan closure: Submit loan closure letter, Form 35, NOC from bank, RC original. Processing: 15-20 days. Fee: ₹100-200.',
                'source': 'Banking and Finance Rules',
                'tags': ['hypothecation', 'loan', 'finance', 'NOC']
            }
        ]

        # Build inverted index for BM25-style retrieval
        self.inverted_index = {}
        self._build_inverted_index()

        # Initialize sentence transformer for dense retrieval
        self.embedder = None
        self.doc_embeddings = None
        if SENTENCE_TRANSFORMERS_AVAILABLE and NUMPY_AVAILABLE:
            try:
                self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
                self._build_dense_index()
            except Exception:
                self.embedder = None

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
        if not self.embedder:
            return

        # Create embeddings for all documents
        texts = [f"{doc['title']}. {doc['content']}" for doc in self.documents]
        try:
            self.doc_embeddings = self.embedder.encode(texts, show_progress_bar=False)
        except Exception:
            self.doc_embeddings = None

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
        if not self.embedder or self.doc_embeddings is None or not NUMPY_AVAILABLE:
            return []

        try:
            # Encode query
            query_embedding = self.embedder.encode([query], show_progress_bar=False)[0]

            # Calculate cosine similarities
            similarities = np.dot(self.doc_embeddings, query_embedding) / (
                np.linalg.norm(self.doc_embeddings, axis=1) * np.linalg.norm(query_embedding)
            )

            # Get top-k indices
            top_indices = np.argsort(similarities)[-top_k:][::-1]

            # Retrieve documents
            results = []
            for idx in top_indices:
                doc = self.documents[idx].copy()
                doc['score'] = float(similarities[idx])
                doc['method'] = 'dense_vector'
                results.append(doc)

            return results
        except Exception:
            return []

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
