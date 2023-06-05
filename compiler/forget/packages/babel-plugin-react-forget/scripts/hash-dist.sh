#!/usr/bin/env bash
set -eo pipefail

# Hashes JS files in the dist directory to create a cache-breaker

find dist -name '*.js' | sort | xargs shasum | shasum | awk '{ print $1 }' > dist/HASH
