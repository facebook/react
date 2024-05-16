'use strict';

let isObject;

describe('isObject', () => {
  beforeEach(() => {
    isObject = require('shared/isObject').default;
  });

  it('test is not object', async () => {
    expect(isObject(null)).toBeFalsy();
  });

  it('test is object', async () => {
    expect(isObject({})).toBeTruthy();
  });
});
