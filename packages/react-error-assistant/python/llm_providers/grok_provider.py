"""
Copyright (c) Meta Platforms, Inc. and affiliates.

This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

Grok (xAI) LLM provider.
"""

import requests
from typing import Dict, Any
from .base_provider import BaseLLMProvider


class GrokProvider(BaseLLMProvider):
    """Grok (xAI) provider"""

    def __init__(self, config: Dict[str, Any]):
        api_key = config.get('apiKey')
        if not api_key:
            raise ValueError('Grok API key is required')

        self.api_key = api_key
        self.model = config.get('model', 'grok-2')
        self.api_endpoint = config.get(
            'apiEndpoint', 'https://api.x.ai/v1/chat/completions'
        )

    def generate(self, prompt: str) -> str:
        """Generate response using Grok"""
        try:
            response = requests.post(
                self.api_endpoint,
                headers={
                    'Authorization': f'Bearer {self.api_key}',
                    'Content-Type': 'application/json',
                },
                json={
                    'model': self.model,
                    'messages': [
                        {'role': 'system', 'content': 'You are a helpful assistant for React/Vite developers.'},
                        {'role': 'user', 'content': prompt},
                    ],
                    'temperature': 0.7,
                },
                timeout=60,
            )
            response.raise_for_status()
            data = response.json()
            return data['choices'][0]['message']['content']
        except requests.exceptions.RequestException as e:
            raise RuntimeError(f'Grok API error: {e}')

    def is_available(self) -> bool:
        """Check if Grok is available"""
        return bool(self.api_key)

