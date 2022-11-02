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
import replace from 'rollup-plugin-replace';
import {rollup} from 'rollup';

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
      plugins: [replace({__DEV__: 'true'})],
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

export {replaceScriptsAndMove, mergeOptions};
