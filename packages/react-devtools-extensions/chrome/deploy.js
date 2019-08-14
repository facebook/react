#!/usr/bin/env node

'use strict';

const deploy = require('../shared/deploy');

const main = async () => await deploy('chrome');

main();
