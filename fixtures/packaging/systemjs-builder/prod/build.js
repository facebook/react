var Builder = require('systemjs-builder');

var builder = new Builder('/', './config.js');
builder
  .buildStatic('./input.js', './output.js')
  .then(()=> {
    console.log('Build complete');
  })
  .catch((err)=> {
    console.log('Build error');
    console.log({err:err.message});
  });
