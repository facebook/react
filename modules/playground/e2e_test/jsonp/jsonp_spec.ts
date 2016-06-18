import {verifyNoBrowserErrors} from '@angular/platform-browser/testing_e2e';

describe('jsonp', function() {

  afterEach(verifyNoBrowserErrors);

  describe('fetching', function() {
    var URL = 'all/playground/src/jsonp/index.html';

    it('should fetch and display people', function() {
      browser.get(URL);
      expect(getComponentText('jsonp-app', '.people')).toEqual('hello, caitp');
    });
  });
});

function getComponentText(selector: any /** TODO #9100 */, innerSelector: any /** TODO #9100 */) {
  return browser.executeScript('return document.querySelector("' + selector + '").querySelector("' +
                               innerSelector + '").textContent.trim()');
}
