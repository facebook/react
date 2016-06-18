import {expect} from '@angular/core/testing';
import {browser, verifyNoBrowserErrors} from '@angular/platform-browser/testing_e2e';

function waitForElement(selector: string) {
  var EC = (<any>protractor).ExpectedConditions;
  // Waits for the element with id 'abc' to be present on the dom.
  browser.wait(EC.presenceOf($(selector)), 20000);
}

function waitForAlert() {
  var EC = (<any>protractor).ExpectedConditions;
  browser.wait(EC.alertIsPresent(), 1000);
}

describe('can deactivate example app', function() {

  afterEach(verifyNoBrowserErrors);

  var URL = '@angular/examples/router/ts/can_deactivate/';

  it('should not navigate away when prompt is cancelled', function() {
    browser.get(URL);
    waitForElement('note-index-cmp');

    element(by.css('#note-1-link')).click();
    waitForElement('note-cmp');

    browser.navigate().back();
    waitForAlert();

    browser.switchTo().alert().dismiss();  // Use to simulate cancel button

    expect(element(by.css('note-cmp')).getText()).toContain('id: 1');
  });

  it('should navigate away when prompt is confirmed', function() {
    browser.get(URL);
    waitForElement('note-index-cmp');

    element(by.css('#note-1-link')).click();
    waitForElement('note-cmp');

    browser.navigate().back();
    waitForAlert();

    browser.switchTo().alert().accept();

    waitForElement('note-index-cmp');

    expect(element(by.css('note-index-cmp')).getText()).toContain('Your Notes');
  });
});
