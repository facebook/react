"""
Copyright (c) Meta Platforms, Inc. and affiliates.

This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

OpenAI LLM provider.
"""

from typing import Dict, Any
from .base_provider import BaseLLMProvider

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None


class OpenAIProvider(BaseLLMProvider):
    """OpenAI provider for GPT models"""

    def __init__(self, config: Dict[str, Any]):
        if OpenAI is None:
            raise ImportError('openai package not installed. Run: pip install openai')

        api_key = config.get('apiKey')
        if not api_key:
            raise ValueError('OpenAI API key is required')

        self.client = OpenAI(api_key=api_key)
        self.model = config.get('model', 'gpt-3.5-turbo')

    def generate(self, prompt: str) -> str:
        """Generate response using OpenAI"""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {'role': 'system', 'content': 'You are a helpful assistant for React/Vite developers.'},
                    {'role': 'user', 'content': prompt},
                ],
                temperature=0.7,
            )
            return response.choices[0].message.content or ''
        except Exception as e:
            raise RuntimeError(f'OpenAI API error: {e}')

    def is_available(self) -> bool:
        """Check if OpenAI is available"""
        return self.client is not None

