#!/usr/bin/env python3
"""
Copyright (c) Meta Platforms, Inc. and affiliates.

This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

Python HTTP server for React Error Assistant RAG pipeline.
"""

import os
import sys
import argparse
import signal
from flask import Flask, request, jsonify
from flask_cors import CORS

# Add current directory to path for imports
import sys
import os
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# Import RAG pipeline components
try:
    from rag_pipeline import RAGPipeline
except ImportError as e:
    # Graceful degradation if RAG components not available
    print(f'Warning: Could not import RAG pipeline: {e}', file=sys.stderr)
    RAGPipeline = None

app = Flask(__name__)
CORS(app)

# Global RAG pipeline instance
rag_pipeline = None


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok'})


@app.route('/api/analyze', methods=['POST'])
def analyze():
    """Analyze error and return solution"""
    if not rag_pipeline:
        return jsonify({
            'error': 'RAG pipeline not initialized. Python dependencies may be missing.'
        }), 503

    try:
        data = request.json
        error = data.get('error', {})
        context = data.get('context', {})

        # Process error through RAG pipeline
        solution = rag_pipeline.process(
            error_message=error.get('message', ''),
            error_type=error.get('type', 'UNKNOWN'),
            component=context.get('component'),
            framework=context.get('framework', 'react'),
            bundler=context.get('bundler', 'vite'),
        )

        return jsonify({'solution': solution})
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500


def initialize_rag_pipeline():
    """Initialize RAG pipeline"""
    global rag_pipeline

    if RAGPipeline is None:
        print('Warning: RAG pipeline components not available.', file=sys.stderr)
        return

    try:
        knowledge_base_path = os.environ.get(
            'KNOWLEDGE_BASE_PATH',
            os.path.join(os.path.expanduser('~'), '.react-error-assistant', 'knowledge-base')
        )

        # Load configuration
        config_path = os.path.join(
            os.path.expanduser('~'),
            '.react-error-assistant',
            'config.json'
        )

        rag_pipeline = RAGPipeline(
            knowledge_base_path=knowledge_base_path,
            config_path=config_path if os.path.exists(config_path) else None,
        )
        print('RAG pipeline initialized successfully.', file=sys.stderr)
    except Exception as e:
        print(f'Failed to initialize RAG pipeline: {e}', file=sys.stderr)
        rag_pipeline = None


def signal_handler(sig, frame):
    """Handle shutdown signals"""
    print('\nShutting down server...', file=sys.stderr)
    sys.exit(0)


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='React Error Assistant Python Server')
    parser.add_argument('--port', type=int, default=8080, help='Server port')
    args = parser.parse_args()

    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Initialize RAG pipeline
    initialize_rag_pipeline()

    # Start server
    print(f'Starting React Error Assistant server on port {args.port}...', file=sys.stderr)
    app.run(host='127.0.0.1', port=args.port, debug=False)


if __name__ == '__main__':
    main()

