import {verifyNoBrowserErrors} from '@angular/platform-browser/testing_e2e';

describe('http', function() {

  afterEach(verifyNoBrowserErrors);

  describe('fetching', function() {
    var URL = 'all/playground/src/http/index.html';

    it('should fetch and display people', function() {
      browser.get(URL);
      expect(getComponentText('http-app', '.people')).toEqual('hello, Jeff');
    });
  });
});

function getComponentText(selector: any /** TODO #9100 */, innerSelector: any /** TODO #9100 */) {
  return browser.executeScript('return document.querySelector("' + selector + '").querySelector("' +
                               innerSelector + '").textContent.trim()');
}
