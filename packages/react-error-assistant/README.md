# `react-error-assistant`

A RAG-powered error message assistant for React/Vite development that provides contextual solutions to compilation errors in real-time.

## Overview

`react-error-assistant` is a Vite plugin designed for **development mode** that intercepts compilation errors, analyzes them using a local RAG (Retrieval-Augmented Generation) system, and provides actionable solutions with code examples.

> **Note**: This assistant is optimized for **dev mode** (`vite dev`). Build mode (`vite build`) has limited error interception support due to how Vite/Rollup outputs build errors.

## Features

- **Real-time Error Analysis**: Intercepts Vite compilation errors during **development mode**
- **Contextual Solutions**: Uses RAG to retrieve relevant solutions from React/Vite documentation
- **Privacy-First**: Works 100% locally with Ollama (optional cloud LLMs: OpenAI, Grok)
- **Multiple LLM Providers**: Supports Ollama (local), OpenAI, and Grok (xAI)
- **Offline Support**: Full functionality with local LLM (Ollama)
- **Dev Mode Optimized**: Designed for `vite dev` workflow with automatic error detection on file save

## Installation

```sh
# npm
npm install react-error-assistant --save-dev

# yarn
yarn add react-error-assistant --dev
```

## Prerequisites

- **Node.js**: 18+
- **Python**: 3.9+ (optional, for RAG features)
- **Ollama**: (optional, for local LLM - recommended for privacy)

## Quick Start

### 1. Install the Package

```sh
yarn add react-error-assistant --dev
```

### 2. Configure Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { errorAssistant } from 'react-error-assistant/vite';

export default defineConfig({
  plugins: [
    react(),
    errorAssistant({
      enabled: true,
    }),
  ],
});
```

### 3. Set Up Python Environment (Recommended)

For RAG features, set up Python:

```sh
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
cd packages/react-error-assistant
pip install -r python/requirements.txt
```

### 4. Download Knowledge Base (Recommended)

```sh
# Download React/Vite docs and build knowledge base
yarn react-error-assistant:download-kb
```

### 5. Configure LLM Provider

Create `~/.react-error-assistant/config.json`:

```json
{
  "llm": {
    "provider": "ollama",
    "model": "llama3.1:8b",
    "baseUrl": "http://localhost:11434"
  },
  "enabled": true,
  "confidenceThreshold": 0.7
}
```

**Example: OpenAI/ChatGPT Configuration** (commented out for reference):

```json
{
  "llm": {
    "provider": "openai",
    "model": "gpt-3.5-turbo",
    "apiKey": "your-openai-api-key-here"
  },
  "enabled": true,
  "confidenceThreshold": 0.7
}
```

## Configuration

### Plugin Options

```typescript
interface ErrorAssistantOptions {
  enabled?: boolean;  // Default: true
  configPath?: string;  // Default: '~/.react-error-assistant/config.json'
  pythonServerPort?: number;  // Default: auto-detect (starts at 8080)
  knowledgeBasePath?: string;  // Default: '~/.react-error-assistant/knowledge-base/'
}
```

### LLM Provider Configuration

**Ollama (Recommended - Local, Private):**
```json
{
  "llm": {
    "provider": "ollama",
    "model": "llama3.1:8b",
    "baseUrl": "http://localhost:11434"
  }
}
```

**OpenAI:**
```json
{
  "llm": {
    "provider": "openai",
    "model": "gpt-3.5-turbo",
    "apiKey": "sk-your-api-key-here"
  }
}
```

**Grok (xAI):**
```json
{
  "llm": {
    "provider": "grok",
    "model": "grok-2",
    "apiKey": "your-api-key-here"
  }
}
```

## How It Works

1. **Error Interception**: Vite plugin hooks into `buildEnd()` and `handleHotUpdate()` to catch errors
2. **Error Parsing**: Extracts error type, message, stack trace, component name, and file context
3. **RAG Pipeline**: 
   - Embeds error query using sentence-transformers
   - Searches local knowledge base (Chroma DB) for relevant solutions
   - Generates contextual explanation using configured LLM
4. **Solution Display**: Shows solution inline with Vite error output

## Graceful Degradation

The plugin works without Python installed, but RAG features will be unavailable. Error parsing and basic functionality will still work.

## Limitations

### Error Types Supported

The assistant catches and provides solutions for the following error types:

- ✅ **MODULE_NOT_FOUND** - Import resolution failures (dev & build)
- ✅ **SYNTAX_ERROR** - Syntax errors (dev & build)
- ✅ **TRANSFORM_ERROR** - Code transformation failures (dev & build)
- ✅ **MODULE_RESOLUTION_ERROR** - Module resolution issues (dev & build)
- ⚠️ **TYPE_ERROR** - TypeScript type errors (dev mode only, see below)
- ✅ **HMR_ERROR** - Hot module replacement errors (dev mode)

### TypeScript Type Errors

**TYPE_ERROR** detection has the following limitations:

- **Dev Mode**: TypeScript errors are not shown by default in Vite dev mode. To see type errors during development, you may need to configure `@vitejs/plugin-react` with TypeScript checking enabled, or run `tsc --noEmit` separately.

- **Build Mode**: During production builds (`yarn build` or `vite build`), TypeScript errors are caught by `tsc` (which runs before Vite build). These errors are displayed in the terminal but are **not processed by the error assistant** because:
  - `tsc` runs as a separate process before Vite
  - The build script stops at the `tsc` step if errors are found (`tsc && vite build`)
  - Our Vite plugin hooks only fire when Vite build actually runs

**Workaround**: Run `tsc --noEmit` manually to check for type errors, or configure your build process to continue past TypeScript errors if you want Vite to process them.

### Error Detection Timing

- **Dev Mode** ✅: 
  - **Primary Use Case**: Errors are caught automatically when files are saved or when the browser requests modules
  - Full support for all error types (MODULE_NOT_FOUND, SYNTAX_ERROR, TRANSFORM_ERROR, etc.)
  - Real-time solutions appear in the terminal as you code
- **Build Mode** ⚠️: 
  - **Limited Support**: This assistant is designed for dev mode, not build mode
  - Build-time errors are displayed by Vite/Rollup but are **not processed by the assistant**
  - Vite/Rollup outputs build errors directly to stderr, bypassing our error interception hooks
  - **Recommendation**: Use dev mode (`vite dev`) for error assistance during development
- **HMR**: Errors are caught during Hot Module Replacement updates in dev mode

## Testing

Run tests with:
```sh
yarn test          # TypeScript/Jest tests
yarn test:python   # Python tests (optional)
yarn typecheck     # TypeScript type checking
yarn lint          # ESLint
```

## Architecture

The system consists of two main parts:

1. **Node.js/TypeScript** - Vite plugin, error parsing, and display
2. **Python** - RAG pipeline (embeddings, vector search, LLM generation)

Communication uses an HTTP server (Flask) for better performance than subprocess spawning.

**Key Components:**
- `src/vite-plugin.ts` - Vite plugin integration
- `src/error/` - Error parsing and context extraction
- `src/bridge/python-bridge.ts` - Python HTTP bridge
- `python/rag_pipeline.py` - Main RAG orchestrator
- `python/embedder.py` - Embedding generation
- `python/retriever.py` - Vector search (Chroma DB)
- `python/generator.py` - LLM solution generation

## Contributing

This package follows React's contribution guidelines. See React's main [CONTRIBUTING.md](../../CONTRIBUTING.md) for details.

## License

MIT

