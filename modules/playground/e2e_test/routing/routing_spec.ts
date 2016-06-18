import {verifyNoBrowserErrors} from '@angular/platform-browser/testing_e2e';

function waitForElement(selector: any /** TODO #9100 */) {
  var EC = (<any>protractor).ExpectedConditions;
  // Waits for the element with id 'abc' to be present on the dom.
  browser.wait(EC.presenceOf($(selector)), 20000);
}

describe('routing inbox-app', () => {

  afterEach(verifyNoBrowserErrors);

  describe('index view', () => {
    var URL = 'all/playground/src/routing/';

    it('should list out the current collection of items', () => {
      browser.get(URL);
      waitForElement('.inbox-item-record');
      expect(element.all(by.css('.inbox-item-record')).count()).toEqual(200);
    });

    it('should build a link which points to the detail page', () => {
      browser.get(URL);
      waitForElement('#item-15');
      expect(element(by.css('#item-15')).getAttribute('href')).toMatch(/#\/detail\/15$/);
      element(by.css('#item-15')).click();
      waitForElement('#record-id');
      expect(browser.getCurrentUrl()).toMatch(/\/detail\/15$/);
    });
  });


  describe('drafts view', () => {
    var URL = 'all/playground/src/routing/#/drafts';

    it('should navigate to the drafts view when the drafts link is clicked', () => {
      browser.get(URL);
      waitForElement('.inbox-item-record');
      element(by.linkText('Drafts')).click();
      waitForElement('.page-title');
      expect(element(by.css('.page-title')).getText()).toEqual('Drafts');
    });

    it('should navigate to email details', () => {
      browser.get(URL);
      element(by.linkText('Drafts')).click();
      waitForElement('.inbox-item-record');
      expect(element.all(by.css('.inbox-item-record')).count()).toEqual(2);
      expect(element(by.css('#item-201')).getAttribute('href')).toMatch(/#\/detail\/201$/);
      element(by.css('#item-201')).click();
      waitForElement('#record-id');
      expect(browser.getCurrentUrl()).toMatch(/\/detail\/201$/);
    });
  });


  describe('detail view', () => {
    var URL = 'all/playground/src/routing/';

    it('should navigate to the detail view when an email is clicked', () => {
      browser.get(URL);
      waitForElement('#item-10');
      element(by.css('#item-10')).click();
      waitForElement('#record-id');
      var recordId = element(by.css("#record-id"));
      browser.wait(protractor.until.elementTextIs(recordId, "ID: 10"), 5000);
      expect(recordId.getText()).toEqual('ID: 10');
    });

    it('should navigate back to the email inbox page when the back button is clicked', () => {
      browser.get(URL);
      waitForElement('#item-10');
      element(by.css('#item-10')).click();
      waitForElement('.back-button');
      element(by.css('.back-button')).click();
      expect(browser.getCurrentUrl()).toMatch(/\/$/);
    });

    it('should navigate back to index and sort the page items based on the provided querystring param',
       () => {
         browser.get(URL);
         waitForElement('#item-10');
         element(by.css('#item-10')).click();
         waitForElement('.sort-button');
         element(by.css('.sort-button')).click();
         expect(browser.getCurrentUrl()).toMatch(/\/#\?sort=date$/);
         waitForElement('.inbox-item-record');
         expect(element(by.css(".inbox-item-record > a")).getAttribute("id")).toEqual("item-137");
       });
  })
});
