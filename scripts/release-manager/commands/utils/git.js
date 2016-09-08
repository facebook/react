'use strict';

function isClean(app) {
  return getStatus(app) === '';
}

function getStatus(app) {
  return app.execInRepo(`git status --untracked-files=no --porcelain`);
}

function getBranch(app) {
  return app.execInRepo(`git symbolic-ref HEAD`);
}

function fetch(app, remote) {
  return app.execInRepo(`git fetch ${remote}`);
}

function checkout(app, ref) {
  return app.execInRepo(`git checkout ${ref}`);
}

function pull(app, ref) {
  ref = ref || '';
  return app.execInRepo(`git pull ${ref}`);
}

function merge(app, ref, ff, msg) {
  let opts = [
    ff ? '--ff-only' : '--no-ff',
  ];
  if (!msg) {
    opts.push('--no-edit');
  } else {
    opts.push(`-m '${msg}''`);
  }
  return app.execInRepo(`git merge ${opts.join(' ')} ${ref}`);
}

module.exports = {
  getBranch,
  getStatus,
  isClean,

  checkout,
  fetch,
  pull,
  merge,
};
