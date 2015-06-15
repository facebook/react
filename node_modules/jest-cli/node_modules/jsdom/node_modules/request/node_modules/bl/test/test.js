require('./basic-test')

if (!process.env.SAUCE_KEY || !process.env.SAUCE_USER)
  return console.log('SAUCE_KEY and/or SAUCE_USER not set, not running sauce tests')

if (!/v0\.10/.test(process.version))
  return console.log('Not Node v0.10.x, not running sauce tests')

require('./sauce.js')