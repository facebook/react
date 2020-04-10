'use strict';

/* eslint-disable no-for-of-loops/no-for-of-loops */

const noop = () => {};

async function expectTestToFail(callback, errorMsg) {
  if (callback.length > 0) {
    throw Error(
      'Gated test helpers do not support the `done` callback. Return a ' +
        'promise instead.'
    );
  }
  try {
    const maybePromise = callback();
    if (
      maybePromise !== undefined &&
      maybePromise !== null &&
      typeof maybePromise.then === 'function'
    ) {
      await maybePromise;
    }
  } catch (error) {
    // Failed as expected
    return;
  }
  throw Error(errorMsg);
}

function readFlag(flags, flagName) {
  if (flagName.startsWith('!')) {
    flagName = flagName.slice(1);
    const flagValue = flags[flagName];
    if (flagValue === undefined) {
      throw Error('Missing feature flag: ' + flagName);
    }
    if (flagValue === true) {
      return `Test is expected to fail because ${flagName} is true.`;
    }
  } else {
    const flagValue = flags[flagName];
    if (flagValue === undefined) {
      throw Error('Missing feature flag: ' + flagName);
    }
    if (flagValue === false) {
      return `Test is expected to fail because ${flagName} is false.`;
    }
  }
  return null;
}

function testGate(testFn, flagNames, testName, fn) {
  const featureFlags = require('shared/ReactFeatureFlags');

  let errorMessage;
  if (typeof flagNames === 'string') {
    errorMessage = readFlag(featureFlags, flagNames);
  } else if (Array.isArray(flagNames)) {
    for (const flagName of flagNames) {
      errorMessage = readFlag(featureFlags, flagName);
      if (errorMessage !== null) {
        break;
      }
    }
  } else if (typeof flagNames === 'function') {
    const shouldPass = flagNames(featureFlags);
    errorMessage = shouldPass
      ? null
      : 'Gated test was expected to fail, but it passed.';
  } else {
    throw Error('testGate: Must pass one or more feature flags.');
  }

  // Expect test to pass
  if (errorMessage !== null) {
    testFn(`[GATED, SHOULD FAIL] ${testName}`, () =>
      expectTestToFail(fn, errorMessage)
    );
  } else {
    testFn(testName, fn);
  }
}

function installGatedTestHelpers(channel) {
  const it = global.it;
  const fit = global.fit;
  const xit = global.xit;

  if (channel === 'stable') {
    // Experimental tests should fail when running in the stable channel. For
    // all other channels, the tests should run normally.
    // TODO: What about "classic" and "modern"? It's ambiguous whether the
    // tests should pass or fail in those modes. Maybe we should favor checking
    // the feature flags instead.
    const errorMessage =
      'Tests marked experimental are expected to fail, but this one passed.';
    it.experimental = (name, fn) =>
      it(`[GATED, SHOULD FAIL] ${name}`, () =>
        expectTestToFail(fn, errorMessage));
    fit.experimental = it.only.experimental = (name, fn) =>
      fit(`[GATED, SHOULD FAIL] ${name}`, () =>
        expectTestToFail(fn, errorMessage));

    xit.experimental = it.skip.experimental = (name, fn) =>
      xit(`[GATED, SHOULD FAIL] ${name}`, noop);
  } else {
    it.experimental = it;
    fit.experimental = it.only.experimental = fit;
    xit.experimental = it.skip.experimental = xit;
    global.testExperimental = fn => fn();
  }

  it.gate = testGate.bind(null, it);
  fit.gate = it.gate.only = it.only.gate = testGate.bind(null, fit);
  xit.gate = it.gate.skip = it.skip.gate = testGate.bind(null, xit);

  it.old = testGate.bind(null, it, '!enableNewReconciler');
  fit.old = it.old.only = it.only.old = testGate.bind(
    null,
    fit,
    '!enableNewReconciler'
  );
  xit.old = it.old.skip = it.skip.old = testGate.bind(
    null,
    xit,
    '!enableNewReconciler'
  );

  it.new = testGate.bind(null, it, 'enableNewReconciler');
  fit.new = it.new.only = it.only.new = testGate.bind(
    null,
    fit,
    'enableNewReconciler'
  );
  xit.new = it.new.skip = it.skip.new = testGate.bind(
    null,
    xit,
    'enableNewReconciler'
  );
}

module.exports = installGatedTestHelpers;
