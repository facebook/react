#!/bin/bash
(cd ../.. && yarn build eslint --type=NODE_DEV)
(cd ../.. && watchman-make --make 'yarn build eslint --type=NODE_DEV' -p 'packages/eslint-plugin-*/**/*' -t ignored)
