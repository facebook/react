#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const Vorpal = require('vorpal');
const GitHubAPI = require('github-api');

const fs = require('fs');
const path = require('path');

const child_process = require('child_process');
const execSync = child_process.execSync;

const vorpal = new Vorpal();

// Expects to be in a checkout of react that is a sibling of the react checkout you want to operate on
// eg ~/code/react@release-manager/scripts/release-manager & ~/code/react
// TODO: Make this an argument to the script
const PATH_TO_REPO = path.resolve('../../../react');



// HELPERS

// Simple helper to write out some JSON for debugging
function writeTo(file, data) {
  fs.writeFile(
    path.join(__dirname, 'data', file),
    JSON.stringify(data, null, 2)
  );
}

// Wrapper around exec so we don't have to worry about paths
function execInRepo(command) {
  return execSync(command, {
    cwd: PATH_TO_REPO,
    encoding: 'utf8',
  }).trim();
}

/**
 * Cherry picks a single sha to the given branch. Very crude, but establishes
 * some API. We don't know if the sha is a merge or a squashed commit so just
 * try both.
 *
 * Assume we're already on the right branch.
 */
function gitCherryPickMerge(sha) {
  // console.log(`cherry picking ${sha}`)
  // git cherry-pick -x sha || git cherry-pick -x -m1 sha
  try {
    execInRepo(`git cherry-pick -x ${sha}`);
  } catch (e) {
    // Assume for now this just means it was actually a merge.
    // TODO: gracefully handle other cases, like possibility the commit was
    // already cherry-picked and should be skipped.

    execInRepo(`git cherry-pick -x -m1 ${sha}`)
  }
}

function getReactVersion() {
  return (JSON.parse(fs.readFileSync(path.join(PATH_TO_REPO, 'package.json'), 'utf8'))).version;
}

const app = {
  vorpal,

  updateConfig() {
    // TODO: write this. This should make it possible to start without a config
    // and go through the init process to create one and then re-init the github
    // setup.
  },

  init() {
    // Config
    try {
      this.config = JSON.parse(fs.readFileSync('./.config.json', 'utf8'));
    } catch (e) {
      this.config = {
        token: null,
      }
      console.error('Could not read .config.json. Rate limits are much stricter as a result. Run init to setup.');
    }

    this.PATH_TO_REPO = PATH_TO_REPO;

    // GITHUB
    this.github = new GitHubAPI({
      token: this.config.token,
    });
    this.ghrepo = this.github.getRepo('facebook', 'react');
    this.ghissues = this.github.getIssues('facebook', 'react');

    // HELPERS
    this.writeTo = writeTo;
    this.execInRepo = execInRepo;
    this.gitCherryPickMerge = gitCherryPickMerge;
    this.getReactVersion = getReactVersion;

    // Register commands
    [
      'init',
      'docs-prs',
      'q',
      'stable-prs',
      'version',
    ].forEach((command) => {
      vorpal.use(require(`./commands/${command}`)(vorpal, app));
    });

    vorpal
      .history('react-release-manager')
      .delimiter('rrm \u2234')
      .show();
  }
}

app.init();
