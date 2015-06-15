#!/usr/bin/env node
'use strict';
var stdin = require('get-stdin');
var pkg = require('./package.json');
var hasAnsi = require('./');
var argv = process.argv.slice(2);
var input = argv[0];

function help() {
	console.log([
		'',
		'  ' + pkg.description,
		'',
		'  Usage',
		'    has-ansi <string>',
		'    echo <string> | has-ansi',
		'',
		'  Exits with code 0 if input has ANSI escape codes and 1 if not'
	].join('\n'));
}

function init(data) {
	process.exit(hasAnsi(data) ? 0 : 1);
}

if (argv.indexOf('--help') !== -1) {
	help();
	return;
}

if (argv.indexOf('--version') !== -1) {
	console.log(pkg.version);
	return;
}

if (process.stdin.isTTY) {
	if (!input) {
		help();
		return;
	}

	init(input);
} else {
	stdin(init);
}
