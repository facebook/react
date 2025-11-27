"""
Copyright (c) Meta Platforms, Inc. and affiliates.

This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

LLM provider factory.
"""

from typing import Dict, Any
from .base_provider import BaseLLMProvider
from .ollama_provider import OllamaProvider
from .openai_provider import OpenAIProvider
from .grok_provider import GrokProvider


class LLMProviderFactory:
    """Factory for creating LLM provider instances"""

    @staticmethod
    def create_provider(provider: str, config: Dict[str, Any]) -> BaseLLMProvider:
        """
        Create LLM provider instance

        Args:
            provider: Provider name ('ollama', 'openai', 'grok')
            config: Provider configuration

        Returns:
            LLM provider instance
        """
        if provider == 'ollama':
            return OllamaProvider(config)
        elif provider == 'openai':
            return OpenAIProvider(config)
        elif provider == 'grok':
            return GrokProvider(config)
        else:
            raise ValueError(f'Unknown LLM provider: {provider}')

