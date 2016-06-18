import {verifyNoBrowserErrors} from '@angular/platform-browser/testing_e2e';

describe('SVG', function() {

  var URL = 'all/playground/src/svg/index.html';

  afterEach(verifyNoBrowserErrors);
  beforeEach(() => { browser.get(URL); });

  it('should display SVG component contents', function() {
    var svgText = element.all(by.css('g text')).get(0);
    expect(svgText.getText()).toEqual('Hello');
  });

});
