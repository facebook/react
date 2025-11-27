"""
Copyright (c) Meta Platforms, Inc. and affiliates.

This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

Document chunking for knowledge base.
"""

import re
from typing import List, Dict, Any


class DocumentChunker:
    """Chunk documents into smaller pieces for embedding"""

    def __init__(self, max_tokens: int = 500, overlap: int = 50):
        """
        Initialize chunker

        Args:
            max_tokens: Maximum tokens per chunk (approximate)
            overlap: Number of tokens to overlap between chunks
        """
        self.max_tokens = max_tokens
        self.overlap = overlap

    def chunk_all(self, docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Chunk all documents

        Args:
            docs: List of documents to chunk

        Returns:
            List of chunks with metadata
        """
        all_chunks = []

        for doc in docs:
            chunks = self.chunk_document(doc)
            all_chunks.extend(chunks)

        print(f'📦 Created {len(all_chunks)} chunks from {len(docs)} documents')
        return all_chunks

    def chunk_document(self, doc: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Chunk a single document

        Args:
            doc: Document dictionary with 'content' and 'metadata'

        Returns:
            List of chunks
        """
        content = doc['content']
        metadata = doc['metadata']

        # Split by markdown headers first (preserve structure)
        sections = self._split_by_headers(content)

        chunks = []
        for section in sections:
            # If section is small enough, use as-is
            if self._estimate_tokens(section) <= self.max_tokens:
                chunks.append({
                    'content': section.strip(),
                    'metadata': metadata.copy(),
                })
            else:
                # Split large sections by sentences/paragraphs
                sub_chunks = self._split_large_section(section)
                chunks.extend([
                    {
                        'content': chunk.strip(),
                        'metadata': metadata.copy(),
                    }
                    for chunk in sub_chunks
                ])

        return chunks

    def _split_by_headers(self, content: str) -> List[str]:
        """Split content by markdown headers"""
        # Pattern for markdown headers (# ## ### etc.)
        header_pattern = r'^(#{1,6})\s+(.+)$'
        lines = content.split('\n')
        sections = []
        current_section = []

        for line in lines:
            if re.match(header_pattern, line):
                if current_section:
                    sections.append('\n'.join(current_section))
                current_section = [line]
            else:
                current_section.append(line)

        if current_section:
            sections.append('\n'.join(current_section))

        return sections if sections else [content]

    def _split_large_section(self, content: str) -> List[str]:
        """Split large section into smaller chunks"""
        # Split by paragraphs first
        paragraphs = re.split(r'\n\n+', content)
        chunks = []
        current_chunk = []

        for para in paragraphs:
            para_tokens = self._estimate_tokens(para)
            current_tokens = self._estimate_tokens('\n\n'.join(current_chunk))

            if current_tokens + para_tokens <= self.max_tokens:
                current_chunk.append(para)
            else:
                if current_chunk:
                    chunks.append('\n\n'.join(current_chunk))
                # Start new chunk with overlap
                if chunks and self.overlap > 0:
                    # Add last few sentences from previous chunk
                    prev_chunk = chunks[-1]
                    sentences = re.split(r'[.!?]+\s+', prev_chunk)
                    overlap_text = '. '.join(sentences[-3:]) if len(sentences) >= 3 else prev_chunk[-200:]
                    current_chunk = [overlap_text, para]
                else:
                    current_chunk = [para]

        if current_chunk:
            chunks.append('\n\n'.join(current_chunk))

        return chunks if chunks else [content]

    def _estimate_tokens(self, text: str) -> int:
        """
        Estimate token count (rough approximation: 1 token ≈ 4 characters)
        This is a simple heuristic; actual tokenization would be more accurate
        """
        return len(text) // 4
