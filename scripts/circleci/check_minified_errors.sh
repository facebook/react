#!/bin/bash

# Ensure errors are minified in production

OUT=$(git --no-pager grep -n --untracked --no-exclude-standard 'FIXME (minify-errors-in-prod)' -- './build/*')

if [ "$OUT" != "" ]; then
  echo "$OUT";
  echo -e "\n";
  echo "Detected an unminified error message in the production build. User-facing errors message must have a corresponding error code in scripts/error-codes/codes.json."
  exit 1
fi

exit 0
