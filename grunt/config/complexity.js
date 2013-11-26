module.exports.generic = {
  src: ['./build/modules/**/*.js'],
  options: {
    errorsOnly: false, // show only maintainability errors
    cyclomatic: 3,
    halstead: 8,
    maintainability: 100
  }
};
