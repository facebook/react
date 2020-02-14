#!/usr/bin/env node

'use strict';

const edge = require('windows-edge');

const START_URL = 'https://facebook.github.io/react/';

edge({uri: START_URL}, (err, ps) => {
  if (err) throw err;
  ps.on('error', console.error);
  ps.on('exit', code => {
    // Browser exited
  });
  setTimeout(() => {
    ps.kill();
  }, 2000);
});
