"""
Copyright (c) Meta Platforms, Inc. and affiliates.

This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

Knowledge base indexer - builds vector index.
"""

import os
from typing import List, Dict, Any

try:
    import chromadb
    from chromadb.config import Settings
except ImportError:
    chromadb = None

# Import embedder from parent directory
import sys
import os
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, parent_dir)

try:
    from embedder import Embedder
except ImportError:
    Embedder = None


class KnowledgeBaseIndexer:
    """Build vector index from document chunks"""

    def __init__(self, output_path: str):
        self.output_path = output_path
        self.chroma_db_path = os.path.join(output_path, 'chroma_db')

        if chromadb is None:
            raise ImportError('chromadb not installed. Run: pip install chromadb')

        if Embedder is None:
            raise ImportError(
                'Embedder not available. Ensure embedder.py is in Python path.'
            )

        # Initialize Chroma client
        self.client = chromadb.PersistentClient(
            path=self.chroma_db_path,
            settings=Settings(anonymized_telemetry=False)
        )

        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name='react_docs',
            metadata={'description': 'React/Vite documentation knowledge base'},
        )

        # Initialize embedder
        self.embedder = Embedder()

    def index(self, chunks: List[Dict[str, Any]]) -> None:
        """
        Build vector index from chunks

        Args:
            chunks: List of document chunks to index
        """
        if not chunks:
            print('⚠️  No chunks to index')
            return

        print(f'🔍 Indexing {len(chunks)} chunks...')

        # Clear existing collection if rebuilding
        try:
            self.client.delete_collection('react_docs')
            self.collection = self.client.create_collection(
                name='react_docs',
                metadata={'description': 'React/Vite documentation knowledge base'},
            )
        except:
            pass  # Collection doesn't exist yet

        # Process in batches for efficiency
        batch_size = 100
        total_batches = (len(chunks) + batch_size - 1) // batch_size

        for batch_idx in range(0, len(chunks), batch_size):
            batch = chunks[batch_idx : batch_idx + batch_size]
            batch_num = (batch_idx // batch_size) + 1

            print(f'  Processing batch {batch_num}/{total_batches}...')

            # Extract content and metadata
            contents = [chunk['content'] for chunk in batch]
            metadatas = [chunk['metadata'] for chunk in batch]
            ids = [f"chunk_{batch_idx + i}" for i in range(len(batch))]

            # Generate embeddings
            embeddings = []
            for content in contents:
                embedding = self.embedder.embed(content)
                embeddings.append(embedding)

            # Add to collection
            self.collection.add(
                ids=ids,
                embeddings=embeddings,
                documents=contents,
                metadatas=metadatas,
            )

        print(f'✅ Indexed {len(chunks)} chunks in Chroma DB')
        print(f'📁 Database location: {self.chroma_db_path}')

        # Print statistics
        count = self.collection.count()
        print(f'📊 Total documents in collection: {count}')
