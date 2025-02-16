#!/usr/bin/env node

import {exec} from 'node:child_process';

exec('cd ../.. && yarn build -r stable eslint-plugin-react-hooks');
