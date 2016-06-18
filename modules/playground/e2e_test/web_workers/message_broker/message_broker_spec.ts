import {verifyNoBrowserErrors} from '@angular/platform-browser/testing_e2e';

var URL = 'all/playground/src/web_workers/message_broker/index.html';

describe("MessageBroker", function() {

  afterEach(() => {
    verifyNoBrowserErrors();
    browser.ignoreSynchronization = false;
  });

  it("should bootstrap", () => {
    // This test can't wait for Angular 2 as Testability is not available when using WebWorker
    browser.ignoreSynchronization = true;
    browser.get(URL);
    waitForBootstrap();
    expect(element(by.css("app h1")).getText()).toEqual("WebWorker MessageBroker Test");
  });

  it("should echo messages", () => {
    const VALUE = "Hi There";
    // This test can't wait for Angular 2 as Testability is not available when using WebWorker
    browser.ignoreSynchronization = true;
    browser.get(URL);
    waitForBootstrap();

    var input = element.all(by.css("#echo_input")).first();
    input.sendKeys(VALUE);
    element(by.css("#send_echo")).click();
    var area = element(by.css("#echo_result"));
    browser.wait(protractor.until.elementTextIs(area, VALUE), 5000);
    expect(area.getText()).toEqual(VALUE);
  });
});

function waitForBootstrap(): void {
  browser.wait(protractor.until.elementLocated(by.css("app h1")), 15000);
}
