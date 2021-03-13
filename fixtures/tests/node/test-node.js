global.__VARIANT__ = true;

console.log('STARTED');

global.window = global; // simulate JSDOM
require('scheduler');
