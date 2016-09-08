#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const Vorpal = require('vorpal');
const GitHubAPI = require('github-api');
const untildify = require('untildify');

const fs = require('fs');
const path = require('path');
const os = require('os');

const child_process = require('child_process');
const execSync = child_process.execSync;

const vorpal = new Vorpal();

// Expects to be in a checkout of react that is a sibling of the react checkout you want to operate on
// eg ~/code/react@release-manager/scripts/release-manager & ~/code/react
// TODO: Make this an argument to the script
let PATH_TO_REPO = null;

const PATH_TO_CONFIG = path.resolve(os.homedir(), '.react-release-manager.json');

const DEFAULT_CONFIG = {
  githubToken: null,
  reactPath: path.resolve('../../../react'),
};

// Quick dry run opt-in. This allows quick debugging of execInRepo without
// actually running the command, ensuring no accidental publishing.
const DRY_RUN = false;

// Enabled commands
const COMMANDS = [
  'init',
  'docs-prs',
  'q',
  'stable-prs',
  'version',
  'npm-publish',
  'npm-check-access',
  'npm-grant-access',
  'start-release',
];


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
  vorpal.log(chalk.gray(`Executing ${chalk.underline(command)}`));

  if (DRY_RUN) {
    return '';
  }

  return execSync(command, {
    cwd: PATH_TO_REPO,
    encoding: 'utf8',
  }).trim();
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
    this.config = this.loadConfig();
  },

  loadConfig() {
    try {
      // TODO: validate config
      let config = JSON.parse(fs.readFileSync(PATH_TO_CONFIG, 'utf8'));
      config.reactPath = path.normalize(untildify(config.reactPath));
      PATH_TO_REPO = config.reactPath;
      return config;
    } catch (e) {
      console.error('Attempt to load config file failed. Please run `init` command for initial setup or make sure ~/.react-release-manager.json is valid JSON. Using a default config which may not work properly.');
      return DEFAULT_CONFIG;
    }
  },

  init() {
    this.config = this.loadConfig();

    this.PATH_TO_CONFIG = PATH_TO_CONFIG;

    // GITHUB
    this.github = new GitHubAPI({
      token: this.config.githubToken,
    });
    this.ghrepo = this.github.getRepo('facebook', 'react');
    this.ghissues = this.github.getIssues('facebook', 'react');

    // HELPERS
    this.writeTo = writeTo;
    this.execInRepo = execInRepo;
    this.getReactVersion = getReactVersion;

    // Register commands
    COMMANDS.forEach((command) => {
      vorpal.use(require(`./commands/${command}`)(vorpal, app));
    });

    vorpal
      .history('react-release-manager')
      .delimiter('rrm \u2234')
      .show();
  },
};

app.init();
