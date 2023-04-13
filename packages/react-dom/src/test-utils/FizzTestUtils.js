/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
'use strict';

import * as tmp from 'tmp';
import * as fs from 'fs';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import {rollup} from 'rollup';
import path from 'path';

const rollupCache: Map<string, string | null> = new Map();

// Utility function to read and bundle a standalone browser script
async function getRollupResult(scriptSrc: string): Promise<string | null> {
  const cachedResult = rollupCache.get(scriptSrc);
  if (cachedResult !== undefined) {
    return cachedResult;
  }
  let tmpFile;
  try {
    tmpFile = tmp.fileSync();
    const rollupConfig = {
      input: require.resolve(scriptSrc),
      onwarn: console.warn,
      plugins: [
        replace({__DEV__: 'true', preventAssignment: true}),
        resolve({
          rootDir: path.join(__dirname, '..', '..', '..'),
        }),
      ],
      output: {
        externalLiveBindings: false,
        freeze: false,
        interop: false,
        esModule: false,
      },
    };
    const outputConfig = {
      file: tmpFile.name,
      format: 'iife',
    };
    const bundle = await rollup(rollupConfig);
    await bundle.write(outputConfig);
    const bundleBuffer = Buffer.alloc(4096);
    let bundleStr = '';
    while (true) {
      // $FlowFixMe[incompatible-call]
      const bytes = fs.readSync(tmpFile.fd, bundleBuffer);
      if (bytes <= 0) {
        break;
      }
      bundleStr += bundleBuffer.slice(0, bytes).toString();
    }
    rollupCache.set(scriptSrc, bundleStr);
    return bundleStr;
  } catch (e) {
    rollupCache.set(scriptSrc, null);
    return null;
  } finally {
    if (tmpFile) {
      tmpFile.removeCallback();
    }
  }
}

// Utility function to process received HTML nodes and execute
//  embedded scripts by:
//  1. Matching nonce attributes and moving node into an existing
//      parent container (if passed)
//  2. Resolving scripts with sources
//  3. Moving data attribute nodes to the body
async function replaceScriptsAndMove(
  window: any,
  CSPnonce: string | null,
  node: Node,
  parent: Node | null,
) {
  if (
    node.nodeType === 1 &&
    (node.nodeName === 'SCRIPT' || node.nodeName === 'script')
  ) {
    // $FlowFixMe[incompatible-cast]
    const element = (node: HTMLElement);
    const script = window.document.createElement('SCRIPT');
    const scriptSrc = element.getAttribute('src');
    if (scriptSrc) {
      const rollupOutput = await getRollupResult(scriptSrc);
      if (rollupOutput) {
        // Manually call eval(...) here, since changing the HTML text content
        //  may interfere with hydration
        window.eval(rollupOutput);
      }
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes.item(i);
        script.setAttribute(attr.name, attr.value);
      }
    } else if (element === null || element.getAttribute('nonce') === CSPnonce) {
      script.textContent = node.textContent;
    }
    if (parent) {
      element.parentNode?.removeChild(element);
      parent.appendChild(script);
    } else {
      element.parentNode?.replaceChild(script, element);
    }
  } else if (
    node.nodeType === 1 &&
    // $FlowFixMe[prop-missing]
    node.dataset != null &&
    (node.dataset.rxi != null ||
      node.dataset.rri != null ||
      node.dataset.rci != null ||
      node.dataset.rsi != null)
  ) {
    // External runtime assumes that instruction data nodes are eventually
    // appended to the body
    window.document.body.appendChild(node);
  } else {
    for (let i = 0; i < node.childNodes.length; i++) {
      const inner = node.childNodes[i];
      await replaceScriptsAndMove(window, CSPnonce, inner, null);
    }
    if (parent != null) {
      parent.appendChild(node);
    }
  }
}

function mergeOptions(options: Object, defaultOptions: Object): Object {
  return {
    ...defaultOptions,
    ...options,
  };
}

function stripExternalRuntimeInNodes(
  nodes: HTMLElement[] | HTMLCollection<HTMLElement>,
  externalRuntimeSrc: string | null,
): HTMLElement[] {
  if (!Array.isArray(nodes)) {
    nodes = Array.from(nodes);
  }
  if (externalRuntimeSrc == null) {
    return nodes;
  }
  return nodes.filter(
    n =>
      (n.tagName !== 'SCRIPT' && n.tagName !== 'script') ||
      n.getAttribute('src') !== externalRuntimeSrc,
  );
}

// Since JSDOM doesn't implement a streaming HTML parser, we manually overwrite
// readyState here (currently read by ReactDOMServerExternalRuntime). This does
// not trigger event callbacks, but we do not rely on any right now.
async function withLoadingReadyState<T>(
  fn: () => T,
  document: Document,
): Promise<T> {
  // JSDOM implements readyState in document's direct prototype, but this may
  // change in later versions
  let prevDescriptor = null;
  let proto: Object = document;
  while (proto != null) {
    prevDescriptor = Object.getOwnPropertyDescriptor(proto, 'readyState');
    if (prevDescriptor != null) {
      break;
    }
    proto = Object.getPrototypeOf(proto);
  }
  Object.defineProperty(document, 'readyState', {
    get() {
      return 'loading';
    },
    configurable: true,
  });
  const result = await fn();
  // $FlowFixMe[incompatible-type]
  delete document.readyState;
  if (prevDescriptor) {
    Object.defineProperty(proto, 'readyState', prevDescriptor);
  }
  return result;
}

export {
  replaceScriptsAndMove,
  mergeOptions,
  stripExternalRuntimeInNodes,
  withLoadingReadyState,
};
