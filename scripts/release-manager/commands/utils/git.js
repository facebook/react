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
  let opts = [ff ? '--ff-only' : '--no-ff'];
  if (!msg) {
    opts.push('--no-edit');
  } else {
    opts.push(`-m '${msg}''`);
  }
  return app.execInRepo(`git merge ${opts.join(' ')} ${ref}`);
}

function tag(app, tag, ref) {
  ref = ref || '';
  return app.execInRepo(`git tag ${tag} ${ref}`);
}

function commit(app, msg, all) {
  return app.execInRepo(`git commit -m '${msg}' ${all ? '-a' : ''}`);
}

function push(app, remote, refspec, tags) {
  let opts = [remote, refspec, tags ? '--tags' : ''];
  return app.execInRepo(`git push ${opts.join(' ')}`);
}

/**
 * Cherry picks a single sha to the given branch. Very crude, but establishes
 * some API. We don't know if the sha is a merge or a squashed commit so just
 * try both.
 *
 * Assume we're already on the right branch.
 */
function cherryPickMerge(app, ref) {
  // console.log(`cherry picking ${sha}`)
  // git cherry-pick -x sha || git cherry-pick -x -m1 sha
  try {
    app.execInRepo(`git cherry-pick -x ${ref}`);
  } catch (e) {
    // Assume for now this just means it was actually a merge.
    // TODO: gracefully handle other cases, like possibility the commit was
    // already cherry-picked and should be skipped.

    app.execInRepo(`git cherry-pick -x -m1 ${ref}`);
  }
}

module.exports = {
  getBranch,
  getStatus,
  isClean,

  commit,
  checkout,
  fetch,
  pull,
  push,
  merge,
  tag,

  cherryPickMerge,
};
