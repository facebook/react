/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Performance tests for React Error Assistant.
 */

import { parseError } from '../src/error/parser';
import { extractContext, buildQuery } from '../src/error/context-extractor';

describe('Performance', () => {
  const testError = new Error("Failed to resolve import '@/components/Button' from 'src/App.tsx'");
  testError.stack = 'at App (src/App.tsx:5:23)';

  it('should parse errors quickly (<10ms)', () => {
    const iterations = 100;
    const start = Date.now();

    for (let i = 0; i < iterations; i++) {
      parseError(testError);
    }

    const duration = Date.now() - start;
    const avgTime = duration / iterations;

    expect(avgTime).toBeLessThan(10); // <10ms per parse
  });

  it('should extract context quickly (<1ms)', () => {
    const parsed = parseError(testError);
    const iterations = 1000;
    const start = Date.now();

    for (let i = 0; i < iterations; i++) {
      extractContext(parsed);
    }

    const duration = Date.now() - start;
    const avgTime = duration / iterations;

    expect(avgTime).toBeLessThan(1); // <1ms per extraction
  });

  it('should build queries quickly (<1ms)', () => {
    const parsed = parseError(testError);
    const context = extractContext(parsed);
    const iterations = 1000;
    const start = Date.now();

    for (let i = 0; i < iterations; i++) {
      buildQuery(parsed, context);
    }

    const duration = Date.now() - start;
    const avgTime = duration / iterations;

    expect(avgTime).toBeLessThan(1); // <1ms per query build
  });

  it('should handle multiple errors efficiently', () => {
    const errors = Array.from({ length: 50 }, (_, i) => {
      const err = new Error(`Error ${i}: Failed to resolve import`);
      err.stack = `at Component${i} (src/App${i}.tsx:${i}:${i})`;
      return err;
    });

    const start = Date.now();

    errors.forEach((error) => {
      const parsed = parseError(error);
      const context = extractContext(parsed);
      buildQuery(parsed, context);
    });

    const duration = Date.now() - start;
    const avgTime = duration / errors.length;

    // Should process 50 errors in <100ms total (<2ms per error)
    expect(avgTime).toBeLessThan(2);
  });
});

