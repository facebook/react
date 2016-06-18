library angular2.src.testing.testing_internal;

import 'testing_internal_core.dart' as core;
export 'testing_internal_core.dart'
    hide
        beforeEachProviders,
        beforeEachBindings,
        beforeEach,
        it,
        iit,
        xit,
        testSetup,
        describe,
        ddescribe,
        xdescribe;

import 'package:angular2/platform/testing/browser.dart';
import 'package:angular2/src/facade/collection.dart' show StringMapWrapper;
import "package:angular2/src/core/zone/ng_zone.dart" show NgZone;

export 'test_injector.dart' show inject;

void testSetup() {
  core.setDartBaseTestProviders(TEST_BROWSER_PLATFORM_PROVIDERS, TEST_BROWSER_APPLICATION_PROVIDERS);
}

void beforeEachProviders(Function fn) {
  testSetup();
  core.beforeEachProviders(fn);
}

@Deprecated('using beforeEachProviders instead')
void beforeEachBindings(Function fn) {
  beforeEachProviders(fn);
}

void beforeEach(fn) {
  testSetup();
  core.beforeEach(fn);
}

void it(name, fn, [timeOut = null]) {
  core.it(name, fn, timeOut);
}

void iit(name, fn, [timeOut = null]) {
  core.iit(name, fn, timeOut);
}

void xit(name, fn, [timeOut = null]) {
  core.xit(name, fn, timeOut);
}

void describe(name, fn) {
  testSetup();
  core.describe(name, fn);
}

void ddescribe(name, fn) {
  testSetup();
  core.ddescribe(name, fn);
}

void xdescribe(name, fn) {
  testSetup();
  core.xdescribe(name, fn);
}

bool isInInnerZone() => NgZone.isInAngularZone();
