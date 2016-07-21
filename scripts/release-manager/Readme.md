# react-release-manager

This is a WIP tool that is being used to manage React releases.

General prereqs:
- A separate clone of React, checked out to this branch (currently `release-manager`). This clone should be a sibling to your primary working copy of React. I have these 2 as siblings: `react/` & `react@release-manager`.
- Your `react` clone should have the latest commits fetched before running commands. You may need to rebase or reset & re-run commands if not.


## Commands

### `init`

Run this first, it will make sure you have a GitHub token generated, letting you use the API.

### `docs-prs`

Cherry-picks PRs that have the `Documentation: needs merge to stable` label from `master` to the current branch. Then it removes the label from the PRs and pushes the branch to the remote it's tracking (resulting in Travis CI rebuilding the website)

**Prereqs:**
- Have your `react` clone on the branch from which the production website is generate (currently `15-stable`)

### `stable-prs`

Cherry-picks PRs that are set to the `15-next` milestone. Handles merge conflicts by pausing & allowing you to switch to your working copy of React to manually merge. A menu allows you to continue from where you left off.

**Prereqs:**
- Have your `react` clone on the dev branch (currently `15-dev`)

### `version`

Bumps the version in all the places that need it.

### `q`

A secret alias to `exit` because `q` is faster.
