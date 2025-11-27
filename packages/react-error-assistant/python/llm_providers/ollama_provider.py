"""
Copyright (c) Meta Platforms, Inc. and affiliates.

This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

Ollama LLM provider (local).
"""

import requests
from typing import Dict, Any
from .base_provider import BaseLLMProvider


class OllamaProvider(BaseLLMProvider):
    """Ollama provider for local LLM models"""

    def __init__(self, config: Dict[str, Any]):
        self.base_url = config.get('baseUrl', 'http://localhost:11434')
        self.model = config.get('model', 'llama3.1:8b')
        self.api_endpoint = f'{self.base_url}/api/generate'

    def generate(self, prompt: str) -> str:
        """Generate response using Ollama"""
        try:
            response = requests.post(
                self.api_endpoint,
                json={
                    'model': self.model,
                    'prompt': prompt,
                    'stream': False,
                },
                timeout=60,
            )
            response.raise_for_status()
            data = response.json()
            return data.get('response', '')
        except requests.exceptions.RequestException as e:
            raise RuntimeError(f'Ollama API error: {e}')

    def is_available(self) -> bool:
        """Check if Ollama is available"""
        try:
            response = requests.get(f'{self.base_url}/api/tags', timeout=5)
            return response.status_code == 200
        except:
            return False

