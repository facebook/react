if(!global.jasmine) {
  throw new Error("global.jasmine must exist before requiring jasmine-only. Ensure you require jasmine first.");
}
require('coffee-script')
require('./app/js/jasmine_only')
