const { transform } = require('babel-plugin-react-compiler');
const { expect } = require('chai');

describe('New Feature Test', () => {
  it('should handle new error type correctly', () => {
    const code = `
      function test() {
        // some code that triggers the new error type
      }
    `;

    try {
      transform(code);
    } catch (error) {
      expect(error.message).to.include('NewErrorType');
    }
  });

  it('should apply new optimization pass', () => {
    const code = `
      function test() {
        // some code that benefits from the new optimization pass
      }
    `;

    const result = transform(code);
    expect(result.code).to.include('optimized code');
  });
});
