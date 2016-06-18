import {expect} from '@angular/core/testing';
import {browser, verifyNoBrowserErrors} from '@angular/platform-browser/testing_e2e';

function waitForElement(selector: string) {
  var EC = (<any>protractor).ExpectedConditions;
  // Waits for the element with id 'abc' to be present on the dom.
  browser.wait(EC.presenceOf($(selector)), 20000);
}

describe('reuse example app', function() {

  afterEach(verifyNoBrowserErrors);

  var URL = '@angular/examples/router/ts/reuse/';

  it('should build a link which points to the detail page', function() {
    browser.get(URL);
    waitForElement('my-cmp');

    element(by.css('#naomi-link')).click();
    waitForElement('my-cmp');
    expect(browser.getCurrentUrl()).toMatch(/\/naomi$/);

    // type something into input
    element(by.css('#message')).sendKeys('long time no see!');

    // navigate to Brad
    element(by.css('#brad-link')).click();
    waitForElement('my-cmp');
    expect(browser.getCurrentUrl()).toMatch(/\/brad$/);

    // check that typed input is the same
    expect(element(by.css('#message')).getAttribute('value')).toEqual('long time no see!');
  });

});
