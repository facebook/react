"""
Copyright (c) Meta Platforms, Inc. and affiliates.

This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

Embedding generation for error queries.
"""

from typing import List

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None


class Embedder:
    """Generate embeddings for error queries using sentence-transformers"""

    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        if SentenceTransformer is None:
            raise ImportError(
                'sentence-transformers not installed. Run: pip install sentence-transformers'
            )

        self.model = SentenceTransformer(model_name)

    def embed(self, text: str) -> List[float]:
        """
        Generate embedding for text

        Args:
            text: Input text to embed

        Returns:
            Embedding vector as list of floats
        """
        embedding = self.model.encode(text, convert_to_numpy=True)
        return embedding.tolist()

