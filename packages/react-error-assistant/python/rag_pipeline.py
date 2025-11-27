"""
Copyright (c) Meta Platforms, Inc. and affiliates.

This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

Main RAG pipeline for React Error Assistant.
"""

import os
import sys
import json
from typing import Optional, Dict, Any

# Ensure current directory is in path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

try:
    from embedder import Embedder
    from retriever import Retriever
    from generator import Generator
except ImportError as e:
    # Graceful degradation
    print(f'Warning: Could not import RAG components: {e}', file=sys.stderr)
    Embedder = None
    Retriever = None
    Generator = None


class RAGPipeline:
    """Main RAG pipeline that orchestrates embedding, retrieval, and generation"""

    def __init__(
        self,
        knowledge_base_path: str,
        config_path: Optional[str] = None,
    ):
        self.knowledge_base_path = knowledge_base_path
        self.config = self._load_config(config_path)

        # Initialize components
        self.embedder = None
        self.retriever = None
        self.generator = None

        if Embedder and Retriever and Generator:
            try:
                self.embedder = Embedder()
                self.retriever = Retriever(knowledge_base_path)
                self.generator = Generator(self.config)
            except Exception as e:
                print(f'Warning: Failed to initialize RAG components: {e}')

    def _load_config(self, config_path: Optional[str]) -> Dict[str, Any]:
        """Load configuration from file"""
        if not config_path or not os.path.exists(config_path):
            # Return default config
            return {
                'llm': {
                    'provider': 'ollama',
                    'model': 'llama3.1:8b',
                    'baseUrl': 'http://localhost:11434',
                },
                'enabled': True,
                'confidenceThreshold': 0.7,
            }

        try:
            with open(config_path, 'r') as f:
                return json.load(f)
        except Exception:
            return self._load_config(None)  # Fallback to defaults

    def process(
        self,
        error_message: str,
        error_type: str,
        component: Optional[str] = None,
        framework: str = 'react',
        bundler: str = 'vite',
    ) -> Dict[str, Any]:
        """
        Process error through RAG pipeline and return solution

        Returns:
            Dictionary with solution fields (explanation, cause, steps, codeExamples, etc.)
        """
        if not self.embedder or not self.retriever or not self.generator:
            return {
                'explanation': 'RAG pipeline components not available. Please install Python dependencies.',
                'cause': 'Missing Python dependencies',
                'steps': [
                    'Install Python 3.9+',
                    'Run: pip install -r python/requirements.txt',
                    'Download knowledge base: yarn react-error-assistant:download-kb',
                ],
            }

        try:
            # Build query
            query_parts = [error_message, error_type, framework, bundler]
            if component:
                query_parts.append(component)
            query = ' '.join(query_parts)

            # Generate embedding
            query_embedding = self.embedder.embed(query)

            # Retrieve relevant documents
            retrieved_docs = self.retriever.search(query_embedding, k=5)

            # Generate solution
            solution = self.generator.generate(
                error_message=error_message,
                error_type=error_type,
                retrieved_docs=retrieved_docs,
                component=component,
            )

            return solution
        except Exception as e:
            return {
                'explanation': f'Error processing request: {str(e)}',
                'cause': 'RAG pipeline error',
                'steps': ['Check Python dependencies', 'Verify knowledge base is downloaded'],
            }

