"""
Copyright (c) Meta Platforms, Inc. and affiliates.

This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

Knowledge base loader - downloads React/Vite documentation.
"""

import os
import subprocess
import tempfile
import shutil
from pathlib import Path
from typing import List, Dict, Any
import re


class KnowledgeBaseLoader:
    """Load and download documentation for knowledge base"""

    # Documentation sources
    SOURCES = [
        {
            'name': 'react',
            'url': 'https://github.com/reactjs/react.dev.git',
            'branch': 'main',
            'doc_path': 'src/content',
            'filter': lambda p: p.suffix == '.md' and 'blog' not in str(p),
        },
        {
            'name': 'vite',
            'url': 'https://github.com/vitejs/vite.git',
            'branch': 'main',
            'doc_path': 'docs',
            'filter': lambda p: p.suffix == '.md',
        },
        {
            'name': 'react-router',
            'url': 'https://github.com/remix-run/react-router.git',
            'branch': 'main',
            'doc_path': 'docs',
            'filter': lambda p: p.suffix == '.md',
        },
        {
            'name': 'redux',
            'url': 'https://github.com/reduxjs/redux.git',
            'branch': 'main',
            'doc_path': 'docs',
            'filter': lambda p: p.suffix == '.md',
        },
        {
            'name': 'zustand',
            'url': 'https://github.com/pmndrs/zustand.git',
            'branch': 'main',
            'doc_path': 'docs',
            'filter': lambda p: p.suffix == '.md' or p.name == 'README.md',
        },
    ]

    def download_all(self) -> List[Dict[str, Any]]:
        """
        Download all documentation sources

        Returns:
            List of document dictionaries with content and metadata
        """
        all_docs = []
        temp_dir = tempfile.mkdtemp(prefix='react-error-assistant-')

        try:
            for source in self.SOURCES:
                print(f'📥 Downloading {source["name"]} documentation...')
                try:
                    docs = self._download_source(source, temp_dir)
                    all_docs.extend(docs)
                    print(f'✅ Downloaded {len(docs)} documents from {source["name"]}')
                except Exception as e:
                    print(f'⚠️  Failed to download {source["name"]}: {e}')
                    continue

            print(f'\n📚 Total documents downloaded: {len(all_docs)}')
            return all_docs
        finally:
            # Cleanup temp directory
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir, ignore_errors=True)

    def _download_source(
        self, source: Dict[str, Any], temp_dir: str
    ) -> List[Dict[str, Any]]:
        """Download a single source"""
        repo_dir = os.path.join(temp_dir, source['name'])

        # Clone repository
        subprocess.run(
            ['git', 'clone', '--depth', '1', '--branch', source['branch'], source['url'], repo_dir],
            check=True,
            capture_output=True,
        )

        # Find all markdown files
        doc_path = Path(repo_dir) / source['doc_path']
        if not doc_path.exists():
            # Try alternative paths
            alt_paths = ['docs', 'documentation', 'src/content', 'content']
            for alt_path in alt_paths:
                alt_doc_path = Path(repo_dir) / alt_path
                if alt_doc_path.exists():
                    doc_path = alt_doc_path
                    break

        if not doc_path.exists():
            print(f'⚠️  Documentation path not found for {source["name"]}: {source["doc_path"]}')
            return []

        # Collect markdown files
        docs = []
        for md_file in doc_path.rglob('*.md'):
            # Apply filter
            if not source['filter'](md_file):
                continue

            # Skip non-technical content
            if self._should_skip(md_file):
                continue

            # Read file content
            try:
                content = md_file.read_text(encoding='utf-8')
                if len(content.strip()) < 100:  # Skip very short files
                    continue

                docs.append({
                    'content': content,
                    'metadata': {
                        'source': source['name'],
                        'file': str(md_file.relative_to(repo_dir)),
                        'library': source['name'],
                        'type': self._classify_document(md_file, content),
                    },
                })
            except Exception as e:
                print(f'⚠️  Failed to read {md_file}: {e}')
                continue

        return docs

    def _should_skip(self, file_path: Path) -> bool:
        """Determine if a file should be skipped"""
        path_str = str(file_path).lower()
        skip_patterns = [
            'blog',
            'changelog',
            'contributing',
            'license',
            'readme',  # Skip root READMEs, keep nested ones
            'code-of-conduct',
            'security',
        ]

        # Skip if matches any pattern
        for pattern in skip_patterns:
            if pattern in path_str:
                # Allow nested READMEs in docs directories
                if pattern == 'readme' and 'docs' in path_str:
                    continue
                return True

        return False

    def _classify_document(self, file_path: Path, content: str) -> str:
        """Classify document type"""
        path_str = str(file_path).lower()
        content_lower = content.lower()

        if 'api' in path_str or 'reference' in path_str:
            return 'api'
        elif 'guide' in path_str or 'tutorial' in path_str:
            return 'guide'
        elif 'troubleshoot' in path_str or 'error' in path_str or 'issue' in path_str:
            return 'troubleshooting'
        elif 'hook' in path_str or 'hooks' in content_lower[:500]:
            return 'hooks'
        elif 'component' in path_str or 'component' in content_lower[:500]:
            return 'component'
        else:
            return 'general'
