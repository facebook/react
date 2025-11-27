#!/usr/bin/env python3
"""
Copyright (c) Meta Platforms, Inc. and affiliates.

This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

Script to download and build knowledge base for React Error Assistant.
"""

import os
import sys
import argparse
from pathlib import Path

# Add parent directory to path for imports
script_dir = os.path.dirname(os.path.abspath(__file__))
package_dir = os.path.dirname(os.path.dirname(script_dir))
sys.path.insert(0, package_dir)

try:
    from knowledge.loader import KnowledgeBaseLoader
    from knowledge.chunker import DocumentChunker
    from knowledge.indexer import KnowledgeBaseIndexer
except ImportError as e:
    print(f'Error: Knowledge base components not available: {e}', file=sys.stderr)
    print('Please install Python dependencies: pip install -r requirements.txt', file=sys.stderr)
    print(f'Python path: {sys.path}', file=sys.stderr)
    sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description='Build knowledge base for React Error Assistant')
    parser.add_argument(
        '--output',
        type=str,
        default=os.path.join(os.path.expanduser('~'), '.react-error-assistant', 'knowledge-base'),
        help='Output directory for knowledge base',
    )
    args = parser.parse_args()

    output_path = Path(args.output)
    output_path.mkdir(parents=True, exist_ok=True)

    print('📚 Building knowledge base for React Error Assistant...')
    print(f'Output directory: {output_path}')
    print()

    try:
        # Step 1: Download docs
        print('=' * 80)
        print('1️⃣ Downloading documentation...')
        print('=' * 80)
        loader = KnowledgeBaseLoader()
        docs = loader.download_all()

        if not docs:
            print('⚠️  No documents downloaded. Check your internet connection and git access.')
            sys.exit(1)

        # Step 2: Chunk documents
        print()
        print('=' * 80)
        print('2️⃣ Chunking documents...')
        print('=' * 80)
        chunker = DocumentChunker()
        chunks = chunker.chunk_all(docs)

        if not chunks:
            print('⚠️  No chunks created from documents.')
            sys.exit(1)

        # Step 3: Build index
        print()
        print('=' * 80)
        print('3️⃣ Building vector index...')
        print('=' * 80)
        indexer = KnowledgeBaseIndexer(str(output_path))
        indexer.index(chunks)

        print()
        print('=' * 80)
        print('✅ Knowledge base built successfully!')
        print('=' * 80)
        print(f'Location: {output_path}')
        print(f'Total documents: {len(docs)}')
        print(f'Total chunks: {len(chunks)}')
    except KeyboardInterrupt:
        print('\n\n⚠️  Build interrupted by user')
        sys.exit(1)
    except Exception as e:
        print(f'\n❌ Error building knowledge base: {e}', file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
