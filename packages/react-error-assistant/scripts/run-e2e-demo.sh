#!/bin/bash
# E2E Demo Script for React Error Assistant
# This script runs the test app and demonstrates error handling

echo "🚀 Starting E2E Demo for React Error Assistant"
echo ""

cd fixtures/vite-test-app

echo "📦 Installing dependencies..."
yarn install

echo ""
echo "🔍 Starting Vite dev server with error assistant..."
echo "Watch the terminal for error messages and solutions!"
echo ""
echo "The test app has intentional errors:"
echo "  1. Module not found: @/components/Button (path alias)"
echo "  2. Type error: undefined.map()"
echo ""
echo "Press Ctrl+C to stop"
echo ""

yarn dev

