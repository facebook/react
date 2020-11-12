/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {mkdirSync, writeFileSync} from 'fs';
import {dirname, resolve} from 'path';
import {pathToFileURL} from 'url';

export default class ReactFlightWebpackPlugin {
  constructor(options: {isServer: boolean}) {}

  apply(compiler: any) {
    compiler.hooks.emit.tap('React Transport Plugin', compilation => {
      const json = {};
      compilation.chunks.forEach(chunk => {
        chunk.getModules().forEach(mod => {
          if (!/\.client\.js$/.test(mod.resource)) {
            return;
          }
          const moduleExports = {};
          ['', '*'].concat(mod.buildMeta.providedExports).forEach(name => {
            moduleExports[name] = {
              id: mod.id,
              chunks: chunk.ids,
              name: name,
            };
          });
          const href = pathToFileURL(mod.resource).href;
          if (href !== undefined) {
            json[href] = moduleExports;
          }
        });
      });
      const output = JSON.stringify(json, null, 2);
      const filename = resolve(
        compiler.options.output.path,
        'react-transport-manifest.json',
      );
      mkdirSync(dirname(filename), {recursive: true});
      writeFileSync(filename, output);
    });
  }
}
