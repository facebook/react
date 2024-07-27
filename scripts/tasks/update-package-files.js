/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/**
 * This file updates all the "repository" fields in our `package.json` files.
 *
 * It can be ran by executing this command in the root folder of the repository:
 *
 * node ./scripts/tasks/update-package-files.js
 */
'use strict';

const fsp = require('fs/promises');
const glob = require('glob');
const path = require('path');

glob(
  '**/package.json',
  {
    ignore: [
      // general package.json files to ignore:
      '**/build/**',
      '**/esm/package.json',
      '**/fixtures/**',
      '**/node_modules/**',
      // specific package.json files to ignore:
      'package.json',
      'packages/dom-event-testing-library/package.json',
      'packages/internal-test-utils/package.json',
      'packages/shared/package.json',
      'scripts/eslint-rules/package.json',
    ],
  },
  async (error, files) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const directory = path.dirname(file);
      console.log(`Updating ${i + 1} of ${files.length}: ${file}`);
      const content = await fsp.readFile(file);
      let json = JSON.parse(content);
      const repository = {
        type: 'git',
        url: 'https://github.com/facebook/react.git',
        directory,
      };
      if (json.hasOwnProperty('repository')) {
        json.repository = repository;
      } else {
        const keys = Object.keys(json);
        const insertBeforeKey = keys.includes('scripts')
          ? 'scripts'
          : 'dependencies';
        const newJson = {};
        let inserted = false;
        keys.forEach(key => {
          if (key === insertBeforeKey) {
            newJson.repository = repository;
            inserted = true;
          }
          newJson[key] = json[key];
        });
        if (!inserted) {
          newJson.repository = repository;
        }
        json = newJson;
      }
      await fsp.writeFile(file, JSON.stringify(json, null, 2) + '\n');
    }
  }
);
