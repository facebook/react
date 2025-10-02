#!/bin/sh
#
# To enable this hook, symlink or copy this file to .git/hooks/pre-commit.

# Redirect output to stderr.
exec 1>&2

git diff --cached --name-only --diff-filter=ACMRTUB | \
  grep '\.js$' | \
  xargs ./node_modules/.bin/eslint --
