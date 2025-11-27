"""
Copyright (c) Meta Platforms, Inc. and affiliates.

This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

Base LLM provider interface.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any


class BaseLLMProvider(ABC):
    """Base interface for LLM providers"""

    @abstractmethod
    def generate(self, prompt: str) -> str:
        """
        Generate response from LLM

        Args:
            prompt: Input prompt

        Returns:
            LLM response as string
        """
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """
        Check if provider is available and configured

        Returns:
            True if provider can be used
        """
        pass

