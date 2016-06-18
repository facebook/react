import {verifyNoBrowserErrors} from '@angular/platform-browser/testing_e2e';

describe('Order Management CRUD', function() {
  var URL = 'all/playground/src/order_management/index.html';

  it('should work', function() {
    browser.get(URL);
    verifyNoBrowserErrors();
  });
});
