"""
Copyright (c) Meta Platforms, Inc. and affiliates.

This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

Solution generation using LLM providers.
"""

from typing import List, Dict, Any, Optional
from llm_providers.factory import LLMProviderFactory


class Generator:
    """Generate solutions using configured LLM provider"""

    def __init__(self, config: Dict[str, Any]):
        llm_config = config.get('llm', {})
        try:
            self.provider = LLMProviderFactory.create_provider(
                provider=llm_config.get('provider', 'ollama'),
                config=llm_config,
            )
        except Exception as e:
            # Graceful degradation if provider can't be initialized
            self.provider = None
            print(f'Warning: Could not initialize LLM provider: {e}', file=__import__('sys').stderr)

    def generate(
        self,
        error_message: str,
        error_type: str,
        retrieved_docs: List[Dict[str, Any]],
        component: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate solution from error and retrieved docs

        Args:
            error_message: Error message
            error_type: Type of error
            retrieved_docs: Retrieved relevant documents
            component: Component name (optional)

        Returns:
            Solution dictionary with explanation, steps, code examples, etc.
        """
        # Check if provider is available
        if not self.provider:
            return {
                'explanation': 'LLM provider not available. Please configure a provider in ~/.react-error-assistant/config.json',
                'cause': 'LLM provider not initialized',
                'steps': [
                    'Install Ollama: https://ollama.ai',
                    'Or configure OpenAI/Grok API key in config.json',
                ],
            }

        # Build prompt
        prompt = self._build_prompt(
            error_message, error_type, retrieved_docs, component
        )

        try:
            # Generate solution using LLM
            response = self.provider.generate(prompt)

            # Parse response into structured format
            solution = self._parse_response(response, retrieved_docs)

            return solution
        except Exception as e:
            # Fallback: Generate solution from retrieved docs without LLM
            return self._generate_from_docs(error_message, error_type, retrieved_docs, component, str(e))

    def _build_prompt(
        self,
        error_message: str,
        error_type: str,
        retrieved_docs: List[Dict[str, Any]],
        component: Optional[str],
    ) -> str:
        """Build prompt for LLM"""
        docs_text = '\n\n'.join([
            f"---\n{doc['content']}\nSource: {doc['metadata'].get('source', 'unknown')}"
            for doc in retrieved_docs
        ])

        prompt = f"""You are a React/Vite error assistant. Given this error:

Error Type: {error_type}
Error Message: {error_message}
{f"Component: {component}" if component else ""}

Relevant documentation:
{docs_text}

Provide a solution. Respond ONLY with valid JSON (no markdown, no code blocks, no extra text):

{{
  "explanation": "Clear explanation of the error and what it means",
  "cause": "The most likely cause of this error",
  "steps": ["Step 1", "Step 2", "Step 3"],
  "codeExamples": [
    {{
      "language": "typescript",
      "code": "// example code here",
      "description": "What this example shows"
    }}
  ],
  "documentationLinks": ["https://example.com/doc"]
}}

Return ONLY the JSON object, nothing else."""

        return prompt

    def _generate_from_docs(
        self,
        error_message: str,
        error_type: str,
        retrieved_docs: List[Dict[str, Any]],
        component: Optional[str],
        llm_error: str,
    ) -> Dict[str, Any]:
        """
        Generate solution from retrieved documents when LLM is unavailable
        """
        if not retrieved_docs:
            return {
                'explanation': f'Could not generate solution: {llm_error}. No relevant documentation found.',
                'cause': 'LLM generation error',
                'steps': [
                    'Check LLM provider configuration',
                    'Verify provider is running/accessible',
                    'Check network connection for API providers',
                ],
            }

        # Extract information from retrieved docs
        doc_content = retrieved_docs[0].get('content', '')
        doc_source = retrieved_docs[0].get('metadata', {}).get('source', 'unknown')
        
        # Build solution from retrieved content
        explanation = f"The error '{error_message}' is a {error_type} error. "
        if 'path alias' in doc_content.lower() or 'vite.config' in doc_content.lower():
            explanation += "This typically occurs when path aliases are not configured in your Vite configuration."
            cause = "Missing path alias configuration in vite.config.ts"
            steps = [
                "Add path alias to vite.config.ts resolve.alias",
                "Configure TypeScript path mapping in tsconfig.json",
                "Ensure the file exists at the expected location",
                "Restart the dev server after making changes"
            ]
            code_examples = [
                {
                    'language': 'typescript',
                    'code': '''// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});''',
                    'description': 'Configure path alias in vite.config.ts'
                },
                {
                    'language': 'json',
                    'code': '''// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}''',
                    'description': 'Configure TypeScript path mapping'
                }
            ]
            documentation_links = [
                'https://vitejs.dev/config/shared-options.html#resolve-alias',
                'https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping'
            ]
        else:
            explanation += f"Based on the documentation: {doc_content[:200]}..."
            cause = error_type
            steps = [
                "Review the error message and file location",
                "Check the documentation for similar issues",
                "Verify your configuration matches the expected format"
            ]
            code_examples = []
            documentation_links = []

        return {
            'explanation': explanation,
            'cause': cause,
            'steps': steps,
            'codeExamples': code_examples,
            'documentationLinks': documentation_links,
            'confidenceScore': 0.75,  # Lower confidence when using fallback
        }

    def _parse_response(
        self, response: str, retrieved_docs: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Parse LLM response into structured solution"""
        import json
        import re
        
        # Try to parse as JSON first (handle double-encoded JSON)
        try:
            # First attempt: direct JSON parse
            solution = json.loads(response)
            # If explanation is a JSON string, parse it again
            if isinstance(solution.get('explanation'), str) and solution['explanation'].strip().startswith('{'):
                try:
                    nested = json.loads(solution['explanation'])
                    solution.update(nested)
                except:
                    pass
        except json.JSONDecodeError:
            # Try to extract JSON from markdown code blocks or plain text
            json_match = re.search(r'\{[^{}]*"explanation"[^{}]*\}', response, re.DOTALL)
            if json_match:
                try:
                    solution = json.loads(json_match.group(0))
                except:
                    solution = None
            else:
                solution = None
            
            if not solution:
                # Fallback: treat as plain text explanation
                return {
                    'explanation': response,
                    'cause': 'See explanation',
                    'steps': ['Review the explanation above'],
                    'confidenceScore': 0.5,
                }
        
        # Normalize field names to match expected format
        if 'codeExamples' not in solution and 'code_examples' in solution:
            solution['codeExamples'] = solution.pop('code_examples')
        if 'documentationLinks' not in solution and 'documentation_links' in solution:
            solution['documentationLinks'] = solution.pop('documentation_links')
        if 'confidenceScore' not in solution:
            # Calculate confidence from retrieved docs
            if retrieved_docs:
                avg_score = sum(doc.get('score', 0) for doc in retrieved_docs) / len(retrieved_docs)
                solution['confidenceScore'] = min(0.95, max(0.5, avg_score))
            else:
                solution['confidenceScore'] = 0.7
        
        return solution

