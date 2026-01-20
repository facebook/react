/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Lightweight script that shows loading indicator immediately
// This runs before the heavy backend scripts are injected

if (!window.__REACT_DEVTOOLS_INSPECTION_LOADING__) {
  window.__REACT_DEVTOOLS_INSPECTION_LOADING__ = true;

  const doc = document;
  const loadingIndicator = doc.createElement('div');
  loadingIndicator.id = '__react-devtools-loading-indicator__';

  Object.assign(loadingIndicator.style, {
    position: 'fixed',
    top: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '10000002',
    backgroundColor: 'rgba(97, 218, 251, 0.95)',
    color: '#1a1a2e',
    borderRadius: '6px',
    padding: '8px 16px',
    fontFamily:
      '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
    fontSize: '12px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  });

  // Add a simple loading spinner
  const spinner = doc.createElement('div');
  Object.assign(spinner.style, {
    width: '12px',
    height: '12px',
    border: '2px solid #1a1a2e',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'react-devtools-spin 0.8s linear infinite',
  });

  // Add keyframe animation
  const style = doc.createElement('style');
  style.id = '__react-devtools-loading-style__';
  style.textContent = `
    @keyframes react-devtools-spin {
      to { transform: rotate(360deg); }
    }
  `;
  doc.head.appendChild(style);

  loadingIndicator.appendChild(spinner);
  loadingIndicator.appendChild(
    doc.createTextNode('React DevTools: Starting inspection...'),
  );

  doc.body.appendChild(loadingIndicator);

  // Also change cursor to indicate loading
  doc.body.style.cursor = 'progress';
}
