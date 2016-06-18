import {verifyNoBrowserErrors} from '@angular/platform-browser/testing/e2e_util';

describe('key_events', function() {

  var URL = 'all/playground/src/key_events/index.html?bundles=false';

  afterEach(verifyNoBrowserErrors);
  beforeEach(() => { browser.get(URL); });

  it('should display correct key names', function() {
    var firstArea = element.all(by.css('.sample-area')).get(0);
    expect(firstArea.getText()).toEqual('(none)');

    // testing different key categories:
    firstArea.sendKeys(protractor.Key.ENTER);
    expect(firstArea.getText()).toEqual('enter');

    firstArea.sendKeys(protractor.Key.SHIFT, protractor.Key.ENTER);
    expect(firstArea.getText()).toEqual('shift.enter');

    firstArea.sendKeys(protractor.Key.CONTROL, protractor.Key.SHIFT, protractor.Key.ENTER);
    expect(firstArea.getText()).toEqual('control.shift.enter');

    firstArea.sendKeys(' ');
    expect(firstArea.getText()).toEqual('space');

    // It would not work with a letter which position depends on the keyboard layout (ie AZERTY vs
    // QWERTY), see https://code.google.com/p/chromedriver/issues/detail?id=553
    firstArea.sendKeys('u');
    expect(firstArea.getText()).toEqual('u');

    firstArea.sendKeys(protractor.Key.CONTROL, 'b');
    expect(firstArea.getText()).toEqual('control.b');

    firstArea.sendKeys(protractor.Key.F1);
    expect(firstArea.getText()).toEqual('f1');

    firstArea.sendKeys(protractor.Key.ALT, protractor.Key.F1);
    expect(firstArea.getText()).toEqual('alt.f1');

    firstArea.sendKeys(protractor.Key.CONTROL, protractor.Key.F1);
    expect(firstArea.getText()).toEqual('control.f1');

    // There is an issue with protractor.Key.NUMPAD0 (and other NUMPADx):
    // chromedriver does not correctly set the location property on the event to
    // specify that the key is on the numeric keypad (event.location = 3)
    // so the following test fails:
    // firstArea.sendKeys(protractor.Key.NUMPAD0);
    // expect(firstArea.getText()).toEqual('0');
  });

  it('should correctly react to the specified key', function() {
    var secondArea = element.all(by.css('.sample-area')).get(1);
    secondArea.sendKeys(protractor.Key.SHIFT, protractor.Key.ENTER);
    expect(secondArea.getText()).toEqual('You pressed shift.enter!');
  });

  it('should not react to incomplete keys', function() {
    var secondArea = element.all(by.css('.sample-area')).get(1);
    secondArea.sendKeys(protractor.Key.ENTER);
    expect(secondArea.getText()).toEqual('');
  });

  it('should not react to keys with more modifiers', function() {
    var secondArea = element.all(by.css('.sample-area')).get(1);
    secondArea.sendKeys(protractor.Key.CONTROL, protractor.Key.SHIFT, protractor.Key.ENTER);
    expect(secondArea.getText()).toEqual('');
  });

});
