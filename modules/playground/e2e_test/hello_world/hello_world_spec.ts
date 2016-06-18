import {verifyNoBrowserErrors} from '@angular/platform-browser/testing_e2e';

describe('hello world', function() {

  afterEach(verifyNoBrowserErrors);

  describe('hello world app', function() {
    var URL = 'all/playground/src/hello_world/index.html';

    it('should greet', function() {
      browser.get(URL);

      expect(getComponentText('hello-app', '.greeting')).toEqual('hello world!');
    });

    it('should change greeting', function() {
      browser.get(URL);

      clickComponentButton('hello-app', '.changeButton');
      expect(getComponentText('hello-app', '.greeting')).toEqual('howdy world!');
    });
  });

});

function getComponentText(selector: any /** TODO #9100 */, innerSelector: any /** TODO #9100 */) {
  return browser.executeScript('return document.querySelector("' + selector + '").querySelector("' +
                               innerSelector + '").textContent');
}

function clickComponentButton(selector: any /** TODO #9100 */, innerSelector: any /** TODO #9100 */) {
  return browser.executeScript('return document.querySelector("' + selector + '").querySelector("' +
                               innerSelector + '").click()');
}
