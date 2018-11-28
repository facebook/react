#!/usr/bin/env node

'use strict';

const http = require('request-promise-json');
const {logPromise} = require('../utils');

const run = async () => {
  // https://circleci.com/docs/api/#recent-builds-for-a-project-branch
  const metadataURL = `https://circleci.com/api/v1.1/project/github/facebook/react/tree/master`;
  const metadata = await http.get(metadataURL, true);
  const build = metadata.find(
    entry => entry.branch === 'master' && entry.status === 'success'
  ).build_num;

  return build;
};

module.exports = async params => {
  return logPromise(
    run(params),
    'Determining latest Circle CI for the master branch'
  );
};
