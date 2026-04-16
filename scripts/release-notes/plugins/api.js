/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {readFileSync, writeFileSync, existsSync} from 'fs';
import {join} from 'path';

const STATE_FILE = join(process.cwd(), 'data', 'state.json');

function getDefaultState() {
  return {
    includedCommits: {},
    reviewedCommits: {},
    customTags: [],
    tagAssignments: {},
  };
}

function readState() {
  if (existsSync(STATE_FILE)) {
    try {
      return JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
    } catch {
      return getDefaultState();
    }
  }
  return getDefaultState();
}

function writeState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

export default function apiPlugin() {
  return {
    name: 'release-notes-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/state' && req.method === 'GET') {
          const state = readState();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(state));
          return;
        }

        if (req.url === '/api/state' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const state = JSON.parse(body);
              writeState(state);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ok: true}));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({error: 'Invalid JSON'}));
            }
          });
          return;
        }

        next();
      });
    },
  };
}
