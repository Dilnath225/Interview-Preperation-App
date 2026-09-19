"""
RAG (Retrieval Augmented Generation) Service
=============================================
Manages the knowledge base ingestion, ChromaDB vector storage,
and semantic retrieval for interview preparation context.

Uses sentence-transformers for local embeddings (no API key needed)
and ChromaDB for vector storage (Docker container or in-memory fallback).
"""

import os
import glob
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

CHROMA_HOST = os.getenv("CHROMA_HOST", "localhost")
CHROMA_PORT = int(os.getenv("CHROMA_PORT", "8100"))
KNOWLEDGE_BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "knowledge_base")
COLLECTION_NAME = "interview_prep_knowledge"


class RAGService:
    """
    Handles knowledge base ingestion into ChromaDB and semantic retrieval.
    Falls back to in-memory ChromaDB if Docker container is not available.
    """

    _client = None
    _collection = None
    _initialized = False

    @classmethod
    def initialize(cls) -> bool:
        """
        Load knowledge base documents, chunk them, embed them, and store in ChromaDB.
        Returns True if initialization succeeds, False otherwise.
        """
        if cls._initialized:
            print("[RAGService] Already initialized, skipping.")
            return True

        try:
            import chromadb
            from chromadb.config import Settings

            # Try connecting to Docker ChromaDB first
            try:
                cls._client = chromadb.HttpClient(
                    host=CHROMA_HOST,
                    port=CHROMA_PORT,
                    settings=Settings(anonymized_telemetry=False),
                )
                # Test connection
                cls._client.heartbeat()
                print(f"[RAGService] ✅ Connected to ChromaDB at {CHROMA_HOST}:{CHROMA_PORT}")
            except Exception as e:
                print(f"[RAGService] ⚠️ ChromaDB Docker not reachable ({e}), using in-memory fallback...")
                cls._client = chromadb.Client(Settings(anonymized_telemetry=False))
                print("[RAGService] ✅ Using in-memory ChromaDB (data will not persist across restarts)")

            # Get or create collection with default embedding function
            # ChromaDB's default uses sentence-transformers all-MiniLM-L6-v2
            cls._collection = cls._client.get_or_create_collection(
                name=COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"},
            )

            # Check if collection already has documents
            existing_count = cls._collection.count()
            if existing_count > 0:
                print(f"[RAGService] ✅ Collection already has {existing_count} documents. Skipping ingestion.")
                cls._initialized = True
                return True

            # Load and ingest knowledge base
            documents, metadatas, ids = cls._load_and_chunk_documents()

            if not documents:
                print("[RAGService] ⚠️ No knowledge base documents found. RAG will work without context.")
                cls._initialized = True
                return True

            # Batch add to ChromaDB (handles embedding internally)
            batch_size = 50
            for i in range(0, len(documents), batch_size):
                batch_docs = documents[i:i + batch_size]
                batch_metas = metadatas[i:i + batch_size]
                batch_ids = ids[i:i + batch_size]

                cls._collection.add(
                    documents=batch_docs,
                    metadatas=batch_metas,
                    ids=batch_ids,
                )

            print(f"[RAGService] ✅ Ingested {len(documents)} document chunks into ChromaDB.")
            cls._initialized = True
            return True

        except ImportError as e:
            print(f"[RAGService] ❌ Missing dependency: {e}. Install with: pip install chromadb sentence-transformers")
            cls._initialized = False
            return False
        except Exception as e:
            print(f"[RAGService] ❌ Initialization failed: {e}")
            cls._initialized = False
            return False

    @classmethod
    def _load_and_chunk_documents(cls) -> tuple:
        """
        Load markdown files from knowledge_base directory,
        split them into meaningful chunks, and prepare for ingestion.
        """
        documents: List[str] = []
        metadatas: List[Dict] = []
        ids: List[str] = []

        # Find all markdown files in knowledge base
        md_files = glob.glob(os.path.join(KNOWLEDGE_BASE_DIR, "*.md"))

        if not md_files:
            print(f"[RAGService] No .md files found in {KNOWLEDGE_BASE_DIR}")
            return documents, metadatas, ids

        for file_path in md_files:
            file_name = os.path.basename(file_path)
            source_topic = file_name.replace(".md", "").replace("_", " ").title()

            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()

                # Split by sections (## headers)
                chunks = cls._split_by_sections(content)

                for i, chunk in enumerate(chunks):
                    chunk_text = chunk.strip()
                    if len(chunk_text) < 50:  # Skip very small chunks
                        continue

                    doc_id = f"{file_name}_{i}"
                    documents.append(chunk_text)
                    metadatas.append({
                        "source": file_name,
                        "topic": source_topic,
                        "chunk_index": i,
                    })
                    ids.append(doc_id)

                print(f"[RAGService] Loaded {len(chunks)} chunks from {file_name}")

            except Exception as e:
                print(f"[RAGService] Error reading {file_path}: {e}")

        return documents, metadatas, ids

    @staticmethod
    def _split_by_sections(text: str) -> List[str]:
        """
        Split markdown text by ## or ### headers into meaningful chunks.
        Each chunk includes its header for context.
        If a section is too long (>1500 chars), further split by paragraphs.
        """
        lines = text.split("\n")
        chunks: List[str] = []
        current_chunk: List[str] = []
        current_header = ""

        for line in lines:
            # Detect section headers (## or ###)
            if line.startswith("## ") or line.startswith("### "):
                # Save previous chunk
                if current_chunk:
                    chunk_text = "\n".join(current_chunk)
                    # If chunk is too long, split further by double newlines
                    if len(chunk_text) > 1500:
                        sub_chunks = cls_split_long_chunk(chunk_text, current_header)
                        chunks.extend(sub_chunks)
                    else:
                        chunks.append(chunk_text)

                current_header = line
                current_chunk = [line]
            else:
                current_chunk.append(line)

        # Don't forget the last chunk
        if current_chunk:
            chunk_text = "\n".join(current_chunk)
            if len(chunk_text) > 1500:
                sub_chunks = cls_split_long_chunk(chunk_text, current_header)
                chunks.extend(sub_chunks)
            else:
                chunks.append(chunk_text)

        return chunks

    @classmethod
    def retrieve(cls, query: str, top_k: int = 5, filter_topic: Optional[str] = None) -> List[Dict]:
        """
        Perform semantic search on the knowledge base.

        Args:
            query: The user's question or search query
            top_k: Number of top results to return (default 5)
            filter_topic: Optional topic filter (e.g., "Interview Guide")

        Returns:
            List of dicts with 'text', 'source', 'topic', 'distance' keys
        """
        if not cls._initialized or cls._collection is None:
            print("[RAGService] Not initialized. Attempting initialization...")
            cls.initialize()

        if cls._collection is None:
            return []

        try:
            # Build query parameters
            query_params = {
                "query_texts": [query],
                "n_results": min(top_k, cls._collection.count() or 1),
            }

            # Add topic filter if specified
            if filter_topic:
                query_params["where"] = {"topic": {"$eq": filter_topic}}

            results = cls._collection.query(**query_params)

            # Parse results into clean format
            retrieved_docs = []
            if results and results["documents"] and results["documents"][0]:
                for i, doc in enumerate(results["documents"][0]):
                    retrieved_docs.append({
                        "text": doc,
                        "source": results["metadatas"][0][i].get("source", "unknown"),
                        "topic": results["metadatas"][0][i].get("topic", "unknown"),
                        "distance": results["distances"][0][i] if results.get("distances") else 0,
                    })

            return retrieved_docs

        except Exception as e:
            print(f"[RAGService] Retrieval error: {e}")
            return []

    @classmethod
    def augment_prompt(cls, user_query: str, context: str = "GENERAL", top_k: int = 5) -> str:
        """
        Build a RAG-augmented prompt by retrieving relevant knowledge base context.

        Args:
            user_query: The user's question
            context: Chat context (INTERVIEW_COACH, RESUME, GENERAL, etc.)
            top_k: Number of context chunks to retrieve

        Returns:
            Augmented system prompt with retrieved context
        """
        retrieved_docs = cls.retrieve(user_query, top_k=top_k)

        if not retrieved_docs:
            # No RAG context available — return empty context
            return ""

        # Build context block from retrieved documents
        context_parts = []
        for i, doc in enumerate(retrieved_docs):
            relevance = f"(relevance: {1 - doc['distance']:.2f})" if doc.get('distance') else ""
            context_parts.append(
                f"--- Knowledge Base [{doc['topic']}] {relevance} ---\n{doc['text']}"
            )

        rag_context = "\n\n".join(context_parts)

        return rag_context

    @classmethod
    def get_status(cls) -> Dict:
        """Return the current status of the RAG service."""
        status = {
            "initialized": cls._initialized,
            "collection_name": COLLECTION_NAME,
            "chroma_host": CHROMA_HOST,
            "chroma_port": CHROMA_PORT,
            "knowledge_base_dir": KNOWLEDGE_BASE_DIR,
            "document_count": 0,
            "connection_type": "none",
        }

        if cls._collection is not None:
            try:
                status["document_count"] = cls._collection.count()
                # Determine if using Docker or in-memory
                if cls._client is not None:
                    try:
                        cls._client.heartbeat()
                        status["connection_type"] = "docker" if hasattr(cls._client, '_server') or CHROMA_HOST != "localhost" else "http"
                    except Exception:
                        status["connection_type"] = "in-memory"
            except Exception:
                pass

        return status


def cls_split_long_chunk(text: str, header: str) -> List[str]:
    """Split a long chunk into smaller sub-chunks by paragraphs."""
    paragraphs = text.split("\n\n")
    sub_chunks = []
    current = header + "\n" if header else ""

    for para in paragraphs:
        if len(current) + len(para) > 1200 and len(current) > 100:
            sub_chunks.append(current.strip())
            current = header + "\n" + para + "\n\n" if header else para + "\n\n"
        else:
            current += para + "\n\n"

    if current.strip():
        sub_chunks.append(current.strip())

    return sub_chunks if sub_chunks else [text]
