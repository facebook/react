#!/usr/bin/env node

const deploy = require('../shared/deploy');

const main = async () => await deploy('chrome');

main();
