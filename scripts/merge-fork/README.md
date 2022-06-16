# merge-fork

Script for syncing changes between forked modules.

## Basic example

```sh
yarn merge-fork --base-dir=packages/react-reconciler/src ReactFiberWorkLoop
```

This will take all the changes in `ReactFiberWorkLoop.new.js` and apply them to `ReactFiberWorkLoop.old.js`.

## Syncing multiple modules at once

You can merge multiple modules at a time:

```sh
yarn merge-fork \
  --base-dir=packages/react-reconciler/src \
  ReactFiberWorkLoop \
  ReactFiberBeginWork \
  ReactFiberCompleteWork \
  ReactFiberCommitWork
```

## Syncing modules with different names

You can provide explicit "old" and "new" file names. This only works for one module at a time:

```sh
yarn merge-fork \
  --base-dir=packages/react-reconciler/src \
  --old=ReactFiberExpirationTime.js \
  --new=ReactFiberLane.js
```

## Syncing modules in the opposite direction (old -> new)

The default is to merge changes from the new module to the old one. To merge changes in the opposite direction, use `--reverse`.

```sh
yarn merge-fork \
  --reverse \
  --base-dir=packages/react-reconciler/src \
  ReactFiberWorkLoop
```

## Comparing changes to an older base rev

By default, the changes are compared to HEAD. You can use `--base-ref` to compare to any rev. For example, while working on a PR, you might make multiple commits to the new fork before you're ready to backport them to the old one. In that case, you want to compare to the merge base of your PR branch:

```sh
yarn merge-fork \
  --base-ref=$(git merge-base HEAD origin/main)
  --base-dir=packages/react-reconciler/src \
  ReactFiberWorkLoop
```

