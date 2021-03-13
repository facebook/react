/** @jest-environment node */

console.log('STARTED');

it('should not crash in node env', () => {
  global.window = global;

  require('scheduler');
});
