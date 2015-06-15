'use strict';
var argv = process.argv;

module.exports = (function () {
	if ('FORCE_COLOR' in process.env) {
		return true;
	}

	if (argv.indexOf('--no-color') !== -1 ||
		argv.indexOf('--no-colors') !== -1 ||
		argv.indexOf('--color=false') !== -1) {
		return false;
	}

	if (argv.indexOf('--color') !== -1 ||
		argv.indexOf('--colors') !== -1 ||
		argv.indexOf('--color=true') !== -1 ||
		argv.indexOf('--color=always') !== -1) {
		return true;
	}

	if (process.stdout && !process.stdout.isTTY) {
		return false;
	}

	if (process.platform === 'win32') {
		return true;
	}

	if ('COLORTERM' in process.env) {
		return true;
	}

	if (process.env.TERM === 'dumb') {
		return false;
	}

	if (/^screen|^xterm|^vt100|color|ansi|cygwin|linux/i.test(process.env.TERM)) {
		return true;
	}

	return false;
})();
