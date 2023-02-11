#!/bin/bash

set -eo pipefail;

npx playwright install;
sudo npx playwright install-deps;
