#!/usr/bin/env bash

set -e

# Bash 4.3 because of arbitrary need to pick a single standard.

if [ "${BASH_VERSINFO[0]}" != "4" ] || [ "${BASH_VERSINFO[1]}" != "3" ]; then
  echo "this script requires bash 4.3" >&2
  exit 1
fi

CDPATH= cd "$(dirname "$0")"

js='require("./")(process.argv[1]).join(" ")'

cat cases.txt | \
  while read case; do
    if [ "${case:0:1}" = "#" ]; then
      continue;
    fi;
    b="$($BASH -c 'for c in '"$case"'; do echo ["$c"]; done')"
    echo "$case"
    echo -n "$b><><><><";
  done > bash-results.txt
