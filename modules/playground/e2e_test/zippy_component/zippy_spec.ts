import {verifyNoBrowserErrors} from '@angular/platform-browser/testing_e2e';

describe('Zippy Component', function() {

  afterEach(verifyNoBrowserErrors);

  describe('zippy', function() {
    var URL = 'all/playground/src/zippy_component/index.html';

    beforeEach(function() { browser.get(URL); });

    it('should change the zippy title depending on it\'s state', function() {
      var zippyTitle = element(by.css('.zippy__title'));

      expect(zippyTitle.getText()).toEqual('▾ Details');
      zippyTitle.click();
      expect(zippyTitle.getText()).toEqual('▸ Details');
    });

    it('should have zippy content', function() {
      expect(element(by.css('.zippy__content')).getText()).toEqual('This is some content.');
    });

    it('should toggle when the zippy title is clicked', function() {
      element(by.css('.zippy__title')).click();
      expect(element(by.css('.zippy__content')).isDisplayed()).toEqual(false);
      element(by.css('.zippy__title')).click();
      expect(element(by.css('.zippy__content')).isDisplayed()).toEqual(true);
    });
  });
});
