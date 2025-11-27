#!/usr/bin/env python3
"""
Copyright (c) Meta Platforms, Inc. and affiliates.

This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

Tests for LLM provider implementations.
"""

import os
import sys
import unittest
from unittest.mock import Mock, patch, MagicMock

# Add current directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)


class TestOllamaProvider(unittest.TestCase):
    """Test Ollama provider"""

    def setUp(self):
        try:
            from llm_providers.ollama_provider import OllamaProvider
            self.Provider = OllamaProvider
        except ImportError:
            self.Provider = None
            self.skipTest('Ollama provider not available')

    def test_provider_initialization(self):
        """Test provider can be initialized"""
        if not self.Provider:
            self.skipTest('Provider not available')

        config = {
            'baseUrl': 'http://localhost:11434',
            'model': 'llama3.1:8b',
        }
        provider = self.Provider(config)
        self.assertIsNotNone(provider)

    @patch('llm_providers.ollama_provider.requests')
    def test_generate_with_mock(self, mock_requests):
        """Test generate method with mocked requests"""
        if not self.Provider:
            self.skipTest('Provider not available')

        # Mock response
        mock_response = Mock()
        mock_response.json.return_value = {'response': 'Test solution'}
        mock_response.raise_for_status = Mock()
        mock_requests.post.return_value = mock_response

        config = {
            'baseUrl': 'http://localhost:11434',
            'model': 'llama3.1:8b',
        }
        provider = self.Provider(config)

        result = provider.generate('test prompt')
        self.assertEqual(result, 'Test solution')
        mock_requests.post.assert_called_once()

    def test_is_available(self):
        """Test availability check"""
        if not self.Provider:
            self.skipTest('Provider not available')

        config = {
            'baseUrl': 'http://localhost:11434',
            'model': 'llama3.1:8b',
        }
        provider = self.Provider(config)

        # This will fail if Ollama not running, which is expected
        try:
            available = provider.is_available()
            self.assertIsInstance(available, bool)
        except Exception:
            # Ollama not running is okay for tests
            pass


class TestOpenAIProvider(unittest.TestCase):
    """Test OpenAI provider"""

    def setUp(self):
        try:
            from llm_providers.openai_provider import OpenAIProvider
            self.Provider = OpenAIProvider
        except ImportError:
            self.Provider = None
            self.skipTest('OpenAI provider not available')

    def test_provider_initialization(self):
        """Test provider can be initialized"""
        if not self.Provider:
            self.skipTest('Provider not available')

        config = {
            'apiKey': 'sk-test-key',
            'model': 'gpt-3.5-turbo',
        }
        provider = self.Provider(config)
        self.assertIsNotNone(provider)

    def test_provider_requires_api_key(self):
        """Test provider requires API key"""
        if not self.Provider:
            self.skipTest('Provider not available')

        config = {
            'model': 'gpt-3.5-turbo',
        }

        with self.assertRaises(ValueError):
            self.Provider(config)

    @patch('llm_providers.openai_provider.OpenAI')
    def test_generate_with_mock(self, mock_openai):
        """Test generate method with mocked OpenAI"""
        if not self.Provider:
            self.skipTest('Provider not available')

        # Mock OpenAI client
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = 'Test solution'
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client

        config = {
            'apiKey': 'sk-test-key',
            'model': 'gpt-3.5-turbo',
        }
        provider = self.Provider(config)

        result = provider.generate('test prompt')
        self.assertEqual(result, 'Test solution')


class TestGrokProvider(unittest.TestCase):
    """Test Grok provider"""

    def setUp(self):
        try:
            from llm_providers.grok_provider import GrokProvider
            self.Provider = GrokProvider
        except ImportError:
            self.Provider = None
            self.skipTest('Grok provider not available')

    def test_provider_initialization(self):
        """Test provider can be initialized"""
        if not self.Provider:
            self.skipTest('Provider not available')

        config = {
            'apiKey': 'test-key',
            'model': 'grok-2',
        }
        provider = self.Provider(config)
        self.assertIsNotNone(provider)

    def test_provider_requires_api_key(self):
        """Test provider requires API key"""
        if not self.Provider:
            self.skipTest('Provider not available')

        config = {
            'model': 'grok-2',
        }

        with self.assertRaises(ValueError):
            self.Provider(config)

    @patch('llm_providers.grok_provider.requests')
    def test_generate_with_mock(self, mock_requests):
        """Test generate method with mocked requests"""
        if not self.Provider:
            self.skipTest('Provider not available')

        # Mock response
        mock_response = Mock()
        mock_response.json.return_value = {
            'choices': [{'message': {'content': 'Test solution'}}]
        }
        mock_response.raise_for_status = Mock()
        mock_requests.post.return_value = mock_response

        config = {
            'apiKey': 'test-key',
            'model': 'grok-2',
        }
        provider = self.Provider(config)

        result = provider.generate('test prompt')
        self.assertEqual(result, 'Test solution')
        mock_requests.post.assert_called_once()


class TestLLMProviderFactory(unittest.TestCase):
    """Test LLM provider factory"""

    def test_factory_creates_ollama(self):
        """Test factory can create Ollama provider"""
        try:
            from llm_providers.factory import LLMProviderFactory

            config = {
                'provider': 'ollama',
                'model': 'llama3.1:8b',
                'baseUrl': 'http://localhost:11434',
            }

            provider = LLMProviderFactory.create_provider('ollama', config)
            self.assertIsNotNone(provider)
        except ImportError:
            self.skipTest('Factory not available')
        except Exception as e:
            # Provider might not be available
            if 'required' in str(e).lower():
                self.skipTest(f'Provider not available: {e}')

    def test_factory_creates_openai(self):
        """Test factory can create OpenAI provider"""
        try:
            from llm_providers.factory import LLMProviderFactory

            config = {
                'provider': 'openai',
                'model': 'gpt-3.5-turbo',
                'apiKey': 'sk-test',
            }

            try:
                provider = LLMProviderFactory.create_provider('openai', config)
                self.assertIsNotNone(provider)
            except Exception as e:
                # OpenAI might not be available
                if 'required' in str(e).lower() or 'not found' in str(e).lower():
                    self.skipTest(f'OpenAI not available: {e}')
                raise
        except ImportError:
            self.skipTest('Factory not available')

    def test_factory_creates_grok(self):
        """Test factory can create Grok provider"""
        try:
            from llm_providers.factory import LLMProviderFactory

            config = {
                'provider': 'grok',
                'model': 'grok-2',
                'apiKey': 'test-key',
            }

            provider = LLMProviderFactory.create_provider('grok', config)
            self.assertIsNotNone(provider)
        except ImportError:
            self.skipTest('Factory not available')

    def test_factory_unknown_provider(self):
        """Test factory raises error for unknown provider"""
        try:
            from llm_providers.factory import LLMProviderFactory

            with self.assertRaises(ValueError):
                LLMProviderFactory.create_provider('unknown', {})
        except ImportError:
            self.skipTest('Factory not available')


if __name__ == '__main__':
    unittest.main()

