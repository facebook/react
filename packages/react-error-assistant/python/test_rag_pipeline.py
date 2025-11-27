#!/usr/bin/env python3
"""
Copyright (c) Meta Platforms, Inc. and affiliates.

This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

Basic tests for RAG pipeline components.
"""

import os
import sys
import unittest
from pathlib import Path

# Add current directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)


class TestEmbedder(unittest.TestCase):
    """Test embedding generation"""

    def setUp(self):
        try:
            from embedder import Embedder
            self.embedder = Embedder()
            self.available = True
        except ImportError:
            self.available = False
            self.skipTest('Embedder dependencies not available')

    def test_embedding_generation(self):
        """Test that embeddings are generated correctly"""
        if not self.available:
            self.skipTest('Embedder not available')

        query = "Cannot find module react"
        embedding = self.embedder.embed(query)

        self.assertIsInstance(embedding, list)
        self.assertGreater(len(embedding), 0)
        # MiniLM-L6-v2 has 384 dimensions
        self.assertEqual(len(embedding), 384)

    def test_embedding_consistency(self):
        """Test that same input produces same embedding"""
        if not self.available:
            self.skipTest('Embedder not available')

        query = "test query"
        embedding1 = self.embedder.embed(query)
        embedding2 = self.embedder.embed(query)

        self.assertEqual(embedding1, embedding2)


class TestRetriever(unittest.TestCase):
    """Test vector retrieval"""

    def setUp(self):
        # Use a test knowledge base path
        test_kb_path = os.path.join(os.path.expanduser('~'), '.react-error-assistant', 'knowledge-base')
        self.kb_path = test_kb_path

    def test_retriever_initialization(self):
        """Test retriever can be initialized"""
        try:
            from retriever import Retriever
            # This will fail if KB doesn't exist, which is expected
            try:
                retriever = Retriever(self.kb_path)
                self.assertIsNotNone(retriever)
            except FileNotFoundError:
                self.skipTest('Knowledge base not found. Run build script first.')
        except ImportError:
            self.skipTest('Retriever dependencies not available')


class TestRAGPipeline(unittest.TestCase):
    """Test RAG pipeline integration"""

    def setUp(self):
        self.kb_path = os.path.join(
            os.path.expanduser('~'),
            '.react-error-assistant',
            'knowledge-base'
        )

    def test_pipeline_initialization(self):
        """Test pipeline can be initialized"""
        try:
            from rag_pipeline import RAGPipeline
            pipeline = RAGPipeline(
                knowledge_base_path=self.kb_path,
                config_path=None,
            )
            self.assertIsNotNone(pipeline)
        except ImportError:
            self.skipTest('RAG pipeline dependencies not available')
        except Exception as e:
            # KB might not exist, that's okay for this test
            if 'not found' in str(e).lower() or 'file' in str(e).lower():
                self.skipTest(f'Knowledge base not available: {e}')
            raise

    def test_pipeline_graceful_degradation(self):
        """Test pipeline degrades gracefully without dependencies"""
        try:
            from rag_pipeline import RAGPipeline
            # Even without KB, should initialize
            pipeline = RAGPipeline(
                knowledge_base_path='/nonexistent/path',
                config_path=None,
            )
            # Should return error message when processing
            result = pipeline.process(
                error_message="test error",
                error_type="UNKNOWN",
            )
            self.assertIn('explanation', result)
        except ImportError:
            self.skipTest('RAG pipeline not available')


class TestLLMProviders(unittest.TestCase):
    """Test LLM provider factory"""

    def test_provider_factory(self):
        """Test provider factory can create providers"""
        try:
            from llm_providers.factory import LLMProviderFactory

            # Test Ollama provider creation
            ollama_config = {
                'provider': 'ollama',
                'model': 'llama3.1:8b',
                'baseUrl': 'http://localhost:11434',
            }
            try:
                provider = LLMProviderFactory.create_provider('ollama', ollama_config)
                self.assertIsNotNone(provider)
            except Exception as e:
                # Provider might not be available, that's okay
                if 'required' in str(e).lower() or 'not found' in str(e).lower():
                    self.skipTest(f'Ollama provider not available: {e}')
                raise

        except ImportError:
            self.skipTest('LLM provider factory not available')


if __name__ == '__main__':
    unittest.main()

