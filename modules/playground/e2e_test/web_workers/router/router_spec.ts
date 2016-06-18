import {verifyNoBrowserErrors} from '@angular/platform-browser/testing_e2e';

describe("WebWorker Router", () => {
  beforeEach(() => {
    // This test can't wait for Angular 2 as Testability is not available when using WebWorker
    browser.ignoreSynchronization = true;
    browser.get('/');
  });

  afterEach(() => {
    verifyNoBrowserErrors();
    browser.ignoreSynchronization = false;
  });

  let contentSelector = "app main h1";
  let navSelector = "app nav ul";
  var baseUrl = 'all/playground/src/web_workers/router/index.html';

  it("should route on click", () => {
    browser.get(baseUrl);

    waitForElement(contentSelector);
    var content = element(by.css(contentSelector));
    expect(content.getText()).toEqual("Start");

    let aboutBtn = element(by.css(navSelector + " .about"));
    aboutBtn.click();
    waitForUrl(/\/about/);
    waitForElement(contentSelector);
    waitForElementText(contentSelector, "About");
    content = element(by.css(contentSelector));
    expect(content.getText()).toEqual("About");
    expect(browser.getCurrentUrl()).toMatch(/\/about/);

    let contactBtn = element(by.css(navSelector + " .contact"));
    contactBtn.click();
    waitForUrl(/\/contact/);
    waitForElement(contentSelector);
    waitForElementText(contentSelector, "Contact");
    content = element(by.css(contentSelector));
    expect(content.getText()).toEqual("Contact");
    expect(browser.getCurrentUrl()).toMatch(/\/contact/);
  });

  it("should load the correct route from the URL", () => {
    browser.get(baseUrl + "#/about");

    waitForElement(contentSelector);
    waitForElementText(contentSelector, "About");
    let content = element(by.css(contentSelector));
    expect(content.getText()).toEqual("About");
  });

  function waitForElement(selector: string): void {
    browser.wait(protractor.until.elementLocated(by.css(selector)), 15000);
  }

  function waitForElementText(contentSelector: string, expected: string): void {
    browser.wait(() => {
      let deferred = protractor.promise.defer();
      var elem = element(by.css(contentSelector));
      elem.getText().then((text) => { return deferred.fulfill(text === expected); });
      return deferred.promise;
    }, 5000);
  }

  function waitForUrl(regex: any /** TODO #9100 */): void {
    browser.wait(() => {
      let deferred = protractor.promise.defer();
      browser.getCurrentUrl().then(
          (url) => { return deferred.fulfill(url.match(regex) !== null); });
      return deferred.promise;
    }, 5000);
  }
});
