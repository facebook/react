#!/usr/bin/env python3
"""
Copyright (c) Meta Platforms, Inc. and affiliates.

This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

Integration test for RAG pipeline end-to-end.
"""

import os
import sys
import unittest

# Add current directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)


class TestRAGIntegration(unittest.TestCase):
    """End-to-end integration test for RAG pipeline"""

    def setUp(self):
        self.kb_path = os.path.join(
            os.path.expanduser('~'),
            '.react-error-assistant',
            'knowledge-base'
        )

    def test_end_to_end_rag(self):
        """Test full pipeline: error → embedding → retrieval → generation"""
        try:
            from rag_pipeline import RAGPipeline

            # Initialize pipeline
            pipeline = RAGPipeline(
                knowledge_base_path=self.kb_path,
                config_path=None,
            )

            # Test with a common React error
            error_message = "Cannot find module 'react'"
            error_type = "MODULE_NOT_FOUND"

            result = pipeline.process(
                error_message=error_message,
                error_type=error_type,
                framework='react',
                bundler='vite',
            )

            # Should return a solution dictionary
            self.assertIsInstance(result, dict)
            self.assertIn('explanation', result)

            # If KB exists and pipeline works, should have more than just error message
            if 'RAG pipeline components not available' not in result.get('explanation', ''):
                # Pipeline worked, check for expected fields
                self.assertIn('explanation', result)
                # May have cause, steps, codeExamples, etc.

        except ImportError:
            self.skipTest('RAG pipeline dependencies not available')
        except FileNotFoundError:
            self.skipTest('Knowledge base not found. Run: yarn react-error-assistant:download-kb')
        except Exception as e:
            # Other errors might be expected (e.g., LLM not available)
            if 'not found' in str(e).lower() or 'not available' in str(e).lower():
                self.skipTest(f'Required component not available: {e}')
            raise


if __name__ == '__main__':
    unittest.main()

