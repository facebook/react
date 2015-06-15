#!/usr/bin/env node
'use strict';
var pkg = require('./package.json');
var supportsColor = require('./');
var argv = process.argv.slice(2);

function help() {
	console.log([
		'',
		'  ' + pkg.description,
		'',
		'  Usage',
		'    supports-color',
		'',
		'  Exits with code 0 if color is supported and 1 if not'
	].join('\n'));
}

if (argv.indexOf('--help') !== -1) {
	help();
	return;
}

if (argv.indexOf('--version') !== -1) {
	console.log(pkg.version);
	return;
}

process.exit(supportsColor ? 0 : 1);
