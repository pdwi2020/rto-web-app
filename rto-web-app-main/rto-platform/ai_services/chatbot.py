import os
from typing import Dict, List, Optional
from .rag_retriever import get_knowledge_base

# RTO-specific system prompt with RAG instructions
RTO_SYSTEM_PROMPT = """You are an AI assistant for the Regional Transport Office (RTO) platform in India. Your role is to help citizens, brokers, and administrators with vehicle registration and licensing services.

**Your expertise includes:**
- Vehicle registration (new vehicles, transfer of ownership)
- Driving license applications (learner's license, permanent license, renewal)
- Vehicle fitness certificates and PUC (Pollution Under Control)
- Fancy number plate reservations
- E-challan payments and traffic violation queries
- NOC (No Objection Certificate) for vehicle transfer
- Insurance requirements and validity
- Broker services and ratings
- Application status tracking
- Document requirements for various RTO services

**Guidelines:**
1. Provide accurate, India-specific RTO information based on retrieved documents
2. Be concise and helpful
3. Guide users on required documents (Aadhaar, PAN, address proof, etc.)
4. Explain application processes step-by-step
5. If asked about this platform specifically, explain that it connects citizens with verified brokers for RTO services
6. Stay focused on RTO/transport-related topics only
7. For non-RTO questions, politely redirect to RTO topics
8. **IMPORTANT**: Always cite your sources when using retrieved information. Format: [Source: document_title]

**When provided with context documents:**
- Use the information from the documents to answer accurately
- Cite the source at the end of your response
- If documents don't contain the answer, say so clearly

**Example services you help with:**
- New vehicle registration
- License renewal (2-wheeler, 4-wheeler, commercial)
- Change of address on registration
- Duplicate RC/DL issuance
- Vehicle hypothecation/loan details
- Age-based license renewal (above 40, above 50)

Answer user questions professionally and helpfully, always grounding responses in retrieved documents when available."""

def get_chatbot_response(message: str, use_rag: bool = False) -> str:
    """
    Get response from Gemini chatbot for RTO-related queries.

    Args:
        message: User's question/message
        use_rag: Whether to use RAG (Retrieval-Augmented Generation)

    Returns:
        Response text from chatbot
    """
    try:
        import google.generativeai as genai
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            return "Gemini API key not configured. Please set GEMINI_API_KEY environment variable."

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            'gemini-2.0-flash-exp',
            system_instruction=RTO_SYSTEM_PROMPT
        )

        # If RAG not requested, use simple generation
        if not use_rag:
            response = model.generate_content(message)
            return response.text

        # RAG-enhanced response
        return get_rag_response(message, model)

    except ImportError:
        return "Gemini API not available. Please install google-generativeai."
    except Exception as e:
        return f"Error: {str(e)}"


def get_rag_response(query: str, model=None, top_k: int = 3) -> str:
    """
    RAG-enhanced chatbot response with evidence linking

    Args:
        query: User's question
        model: Gemini model instance (if None, will create new)
        top_k: Number of documents to retrieve

    Returns:
        Response with citations
    """
    try:
        # Step 1: Retrieve relevant documents
        kb = get_knowledge_base()
        retrieved_docs = kb.retrieve(query, top_k=top_k, method='hybrid')

        # Step 2: Build context from retrieved documents
        context_parts = []
        sources = []

        for i, doc in enumerate(retrieved_docs, 1):
            context_parts.append(
                f"Document {i}: {doc['title']}\n"
                f"Content: {doc['content']}\n"
                f"Source: {doc['source']}\n"
                f"Relevance Score: {doc['score']:.3f}"
            )
            sources.append({
                'title': doc['title'],
                'source': doc['source'],
                'score': doc['score']
            })

        if not context_parts:
            # No relevant documents found, use general knowledge
            context = "No specific documents found. Use your general knowledge about RTO processes in India."
        else:
            context = "\n\n---\n\n".join(context_parts)

        # Step 3: Create RAG prompt
        rag_prompt = f"""Based on the following retrieved documents from our RTO knowledge base, please answer the user's question.

RETRIEVED DOCUMENTS:
{context}

USER QUESTION:
{query}

Please provide a helpful answer based on the retrieved documents. If the documents contain relevant information, cite the source using [Source: ...] format. If the documents don't fully answer the question, acknowledge this and provide the best answer you can."""

        # Step 4: Generate response
        if model is None:
            import google.generativeai as genai
            api_key = os.getenv('GEMINI_API_KEY')
            if not api_key:
                return "Gemini API key not configured."

            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(
                'gemini-2.0-flash-exp',
                system_instruction=RTO_SYSTEM_PROMPT
            )

        response = model.generate_content(rag_prompt)
        answer_text = response.text

        # Step 5: Append evidence (QR-verifiable sources)
        if sources and "[Source:" not in answer_text:
            # Auto-append sources if model didn't cite
            sources_text = "\n\n**Sources Referenced:**\n"
            for src in sources:
                sources_text += f"- {src['title']} ({src['source']}) [Relevance: {src['score']:.0%}]\n"
            answer_text += sources_text

        return answer_text

    except Exception as e:
        return f"RAG Error: {str(e)}. Falling back to direct response."


def get_rag_response_detailed(query: str, top_k: int = 3) -> Dict:
    """
    Get detailed RAG response with metadata

    Returns:
        Dictionary with response, sources, and retrieval info
    """
    try:
        # Retrieve documents
        kb = get_knowledge_base()
        retrieved_docs = kb.retrieve(query, top_k=top_k, method='hybrid')

        # Get response
        response_text = get_rag_response(query, top_k=top_k)

        return {
            'query': query,
            'response': response_text,
            'retrieved_documents': retrieved_docs,
            'num_sources': len(retrieved_docs),
            'retrieval_method': 'hybrid',
            'model': 'gemini-2.0-flash-exp',
            'rag_enabled': True
        }
    except Exception as e:
        return {
            'query': query,
            'response': f"Error: {str(e)}",
            'error': str(e),
            'rag_enabled': False
        }