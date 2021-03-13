console.log('STARTED');

var { JSDOM } = require('jsdom');
var { window } = new JSDOM();
global.window = window;
global.document = window.document;

require('scheduler');
