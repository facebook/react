#!/usr/bin/env node
'use strict';
var fs = require('fs');
var pkg = require('./package.json');
var stripAnsi = require('./');
var argv = process.argv.slice(2);
var input = argv[0];

function help() {
	console.log([
		'',
		'  ' + pkg.description,
		'',
		'  Usage',
		'    strip-ansi <input-file> > <output-file>',
		'    cat <input-file> | strip-ansi > <output-file>',
		'',
		'  Example',
		'    strip-ansi unicorn.txt > unicorn-stripped.txt'
	].join('\n'));
}

function init(data) {
	process.stdout.write(stripAnsi(data));
}

if (argv.indexOf('--help') !== -1) {
	help();
	return;
}

if (argv.indexOf('--version') !== -1) {
	console.log(pkg.version);
	return;
}

if (!input && process.stdin.isTTY) {
	help();
	return;
}

if (input) {
	init(fs.readFileSync(input, 'utf8'));
} else {
	process.stdin.setEncoding('utf8');
	process.stdin.on('data', init);
}
