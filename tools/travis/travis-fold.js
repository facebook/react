module.exports = function travisFoldStart(name) {
  if (process.env.TRAVIS) console.log('travis_fold:start:' + encode(name));

  return function travisFoldEnd() {
    if (process.env.TRAVIS) console.log('travis_fold:end:' + encode(name));
  }
};


function encode(name) {
  return name.replace(/\W/g, '-').replace(/-$/, '');
}
