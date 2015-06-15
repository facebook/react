#!/usr/bin/env node
var far = require('far').create();

far.add(__dirname);
far.include(/test-.*\.js$/);

far.execute();
