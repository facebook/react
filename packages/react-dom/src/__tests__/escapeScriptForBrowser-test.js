/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOMFizzServer;
let Stream;

function getTestWritable() {
  const writable = new Stream.PassThrough();
  writable.setEncoding('utf8');
  const output = {result: '', error: undefined};
  writable.on('data', chunk => {
    output.result += chunk;
  });
  writable.on('error', error => {
    output.error = error;
  });
  const completed = new Promise(resolve => {
    writable.on('finish', () => {
      resolve();
    });
    writable.on('error', () => {
      resolve();
    });
  });
  return {writable, completed, output};
}

describe('escapeScriptForBrowser', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOMFizzServer = require('react-dom/server');
    Stream = require('stream');
  });

  it('"<[Ss]cript" strings are replaced with unicode escaped lowercase s or S depending on case', () => {
    const {writable, output} = getTestWritable();
    const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<div />, {
      bootstrapScriptContent:
        '"prescription pre<scription preScription pre<Scription"',
    });
    pipe(writable);
    jest.runAllTimers();
    expect(output.result).toMatch(
      '<div></div><script>"prescription pre<\\u0073cription preScription pre<\\u0053cription"</script>',
    );
  });

  it('"</[Ss]cript" strings are replaced with encoded lowercase s or S depending on case', () => {
    const {writable, output} = getTestWritable();
    const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<div />, {
      bootstrapScriptContent:
        '"prescription pre</scription preScription pre</Scription"',
    });
    pipe(writable);
    jest.runAllTimers();
    expect(output.result).toMatch(
      '<div></div><script>"prescription pre</\\u0073cription preScription pre</\\u0053cription"</script>',
    );
  });

  it('"[Ss]cript", "/[Ss]cript", "<[Ss]crip", "</[Ss]crip" strings are not escaped', () => {
    const {writable, output} = getTestWritable();
    const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<div />, {
      bootstrapScriptContent:
        '"Script script /Script /script <Scrip <scrip </Scrip </scrip"',
    });
    pipe(writable);
    jest.runAllTimers();
    expect(output.result).toMatch(
      '<div></div><script>"Script script /Script /script <Scrip <scrip </Scrip </scrip"</script>',
    );
  });

  it('matches case insensitively', () => {
    const {writable, output} = getTestWritable();
    const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<div />, {
      bootstrapScriptContent: '"<sCrIpT <ScripT </scrIPT </SCRIpT"',
    });
    pipe(writable);
    jest.runAllTimers();
    expect(output.result).toMatch(
      '<div></div><script>"<\\u0073CrIpT <\\u0053cripT </\\u0073crIPT </\\u0053CRIpT"</script>',
    );
  });

  it('does not escape <, >, &, \\u2028, or \\u2029 characters', () => {
    const {writable, output} = getTestWritable();
    const {pipe} = ReactDOMFizzServer.renderToPipeableStream(<div />, {
      bootstrapScriptContent: '"<, >, &, \u2028, or \u2029"',
    });
    pipe(writable);
    jest.runAllTimers();
    expect(output.result).toMatch(
      '<div></div><script>"<, >, &, \u2028, or \u2029"</script>',
    );
  });
});
