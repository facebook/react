import {verifyNoBrowserErrors} from '@angular/platform-browser/testing_e2e';

describe('Model-Driven Forms', function() {

  afterEach(verifyNoBrowserErrors);

  var URL = 'all/playground/src/model_driven_forms/index.html';

  it('should display errors', function() {
    browser.get(URL);

    var form = element.all(by.css('form')).first();
    var input = element.all(by.css('#creditCard')).first();
    var firstName = element.all(by.css('#firstName')).first();

    input.sendKeys('invalid');
    firstName.click();

    expect(form.getInnerHtml()).toContain('is invalid credit card number');
  });
});
