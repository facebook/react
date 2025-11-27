"""
Copyright (c) Meta Platforms, Inc. and affiliates.

This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

Vector retrieval from Chroma DB.
"""

import os
from typing import List, Dict, Any

try:
    import chromadb
    from chromadb.config import Settings
except ImportError:
    chromadb = None


class Retriever:
    """Retrieve relevant documents from Chroma vector database"""

    def __init__(self, knowledge_base_path: str):
        if chromadb is None:
            raise ImportError('chromadb not installed. Run: pip install chromadb')

        chroma_db_path = os.path.join(knowledge_base_path, 'chroma_db')
        
        if not os.path.exists(chroma_db_path):
            raise FileNotFoundError(
                f'Knowledge base not found at {chroma_db_path}. '
                'Run: yarn react-error-assistant:download-kb'
            )

        self.client = chromadb.PersistentClient(
            path=chroma_db_path,
            settings=Settings(anonymized_telemetry=False)
        )
        self.collection = self.client.get_or_create_collection('react_docs')

    def search(
        self, query_embedding: List[float], k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search for relevant documents

        Args:
            query_embedding: Query embedding vector
            k: Number of results to return

        Returns:
            List of retrieved documents with content and metadata
        """
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=k,
        )

        retrieved_docs = []
        if results['ids'] and len(results['ids'][0]) > 0:
            for i in range(len(results['ids'][0])):
                retrieved_docs.append({
                    'content': results['documents'][0][i] if results['documents'] else '',
                    'metadata': results['metadatas'][0][i] if results['metadatas'] else {},
                    'score': 1.0 - results['distances'][0][i] if results['distances'] else 0.0,
                })

        return retrieved_docs

