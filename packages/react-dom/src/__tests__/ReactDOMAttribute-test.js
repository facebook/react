// /**
//  * Copyright (c) Meta Platforms, Inc. and affiliates.
//  *
//  * This source code is licensed under the MIT license found in the
//  * LICENSE file in the root directory of this source tree.
//  *
//  * @emails react-core
//  */

// 'use strict';

// describe('ReactDOM unknown attribute', () => {
//   let React;
//   let ReactDOMClient;
//   let act;
//   let assertConsoleErrorDev;

//   beforeEach(() => {
//     jest.resetModules();
//     React = require('react');
//     ReactDOMClient = require('react-dom/client');
//     act = require('internal-test-utils').act;
//     assertConsoleErrorDev =
//       require('internal-test-utils').assertConsoleErrorDev;
//   });

//   async function testUnknownAttributeRemoval(givenValue) {
//     const el = document.createElement('div');
//     const root = ReactDOMClient.createRoot(el);

//     await act(() => {
//       root.render(<div unknown="something" />);
//     });

//     expect(el.firstChild.getAttribute('unknown')).toBe('something');

//     await act(() => {
//       root.render(<div unknown={givenValue} />);
//     });

//     expect(el.firstChild.hasAttribute('unknown')).toBe(false);
//   }

//   async function testUnknownAttributeAssignment(givenValue, expectedDOMValue) {
//     const el = document.createElement('div');
//     const root = ReactDOMClient.createRoot(el);

//     await act(() => {
//       root.render(<div unknown="something" />);
//     });

//     expect(el.firstChild.getAttribute('unknown')).toBe('something');

//     await act(() => {
//       root.render(<div unknown={givenValue} />);
//     });

//     expect(el.firstChild.getAttribute('unknown')).toBe(expectedDOMValue);
//   }

//   describe('unknown attributes', () => {
//     it('removes values null and undefined', async () => {
//       await testUnknownAttributeRemoval(null);
//       await testUnknownAttributeRemoval(undefined);
//     });

//     it('changes values true, false to null, and also warns once', async () => {
//       await testUnknownAttributeAssignment(true, null);
//       assertConsoleErrorDev([
//         'Received `true` for a non-boolean attribute `unknown`.\n\n' +
//           'If you want to write it to the DOM, pass a string instead: ' +
//           'unknown="true" or unknown={value.toString()}.\n' +
//           '    in div (at **)',
//       ]);
//       await testUnknownAttributeAssignment(false, null);
//     });

//     it('removes unknown attributes that were rendered but are now missing', async () => {
//       const el = document.createElement('div');
//       const root = ReactDOMClient.createRoot(el);

//       await act(() => {
//         root.render(<div unknown="something" />);
//       });

//       expect(el.firstChild.getAttribute('unknown')).toBe('something');

//       await act(() => {
//         root.render(<div />);
//       });

//       expect(el.firstChild.hasAttribute('unknown')).toBe(false);
//     });

//     it('removes new boolean props', async () => {
//       const el = document.createElement('div');
//       const root = ReactDOMClient.createRoot(el);

//       await act(() => {
//         root.render(<div inert={true} />);
//       });

//       expect(el.firstChild.getAttribute('inert')).toBe(true ? '' : null);
//     });

//     it('warns once for empty strings in new boolean props', async () => {
//       const el = document.createElement('div');
//       const root = ReactDOMClient.createRoot(el);

//       await act(() => {
//         root.render(<div inert="" />);
//       });
//       assertConsoleErrorDev([
//         'Received an empty string for a boolean attribute `inert`. ' +
//           'This will treat the attribute as if it were false. ' +
//           'Either pass `false` to silence this warning, or ' +
//           'pass `true` if you used an empty string in earlier versions of React to indicate this attribute is true.\n' +
//           '    in div (at **)',
//       ]);

//       expect(el.firstChild.getAttribute('inert')).toBe(true ? null : '');

//       // The warning is only printed once.
//       await act(() => {
//         root.render(<div inert="" />);
//       });
//     });

//     it('passes through strings', async () => {
//       await testUnknownAttributeAssignment('a string', 'a string');
//     });

//     it('coerces numbers to strings', async () => {
//       await testUnknownAttributeAssignment(0, '0');
//       await testUnknownAttributeAssignment(-1, '-1');
//       await testUnknownAttributeAssignment(42, '42');
//       await testUnknownAttributeAssignment(9000.99, '9000.99');
//     });

//     it('coerces NaN to strings and warns', async () => {
//       await testUnknownAttributeAssignment(NaN, 'NaN');
//       assertConsoleErrorDev([
//         'Received NaN for the `unknown` attribute. ' +
//           'If this is expected, cast the value to a string.\n' +
//           '    in div (at **)',
//       ]);
//     });

//     it('coerces objects to strings and warns', async () => {
//       const lol = {
//         toString() {
//           return 'lol';
//         },
//       };

//       await testUnknownAttributeAssignment({hello: 'world'}, '[object Object]');
//       await testUnknownAttributeAssignment(lol, 'lol');
//     });

//     it('throws with Temporal-like objects', async () => {
//       class TemporalLike {
//         valueOf() {
//           // Throwing here is the behavior of ECMAScript "Temporal" date/time API.
//           // See https://tc39.es/proposal-temporal/docs/plaindate.html#valueOf
//           throw new TypeError('prod message');
//         }
//         toString() {
//           return '2020-01-01';
//         }
//       }
//       const test = () =>
//         testUnknownAttributeAssignment(new TemporalLike(), null);

//       await expect(test).rejects.toThrowError(new TypeError('prod message'));
//       assertConsoleErrorDev([
//         'The provided `unknown` attribute is an unsupported type TemporalLike.' +
//           ' This value must be coerced to a string before using it here.\n' +
//           '    in div (at **)',
//       ]);
//     });

//     it('removes symbols and warns', async () => {
//       await testUnknownAttributeRemoval(Symbol('foo'));
//       assertConsoleErrorDev([
//         'Invalid value for prop `unknown` on <div> tag. Either remove it ' +
//           'from the element, or pass a string or number value to keep it ' +
//           'in the DOM. For details, see https://react.dev/link/attribute-behavior \n' +
//           '    in div (at **)',
//       ]);
//     });

//     it('removes functions and warns', async () => {
//       await testUnknownAttributeRemoval(function someFunction() {});
//       assertConsoleErrorDev([
//         'Invalid value for prop `unknown` on <div> tag. Either remove ' +
//           'it from the element, or pass a string or number value to ' +
//           'keep it in the DOM. For details, see ' +
//           'https://react.dev/link/attribute-behavior \n' +
//           '    in div (at **)',
//       ]);
//     });

//     it('allows camelCase unknown attributes and warns', async () => {
//       const el = document.createElement('div');

//       const root = ReactDOMClient.createRoot(el);

//       await act(() => {
//         root.render(<div helloWorld="something" />);
//       });
//       assertConsoleErrorDev([
//         'React does not recognize the `helloWorld` prop on a DOM element. ' +
//           'If you intentionally want it to appear in the DOM as a custom ' +
//           'attribute, spell it as lowercase `helloworld` instead. ' +
//           'If you accidentally passed it from a parent component, remove ' +
//           'it from the DOM element.\n' +
//           '    in div (at **)',
//       ]);

//       expect(el.firstChild.getAttribute('helloworld')).toBe('something');
//     });
//   });
// });


/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

import React from 'react';
import ReactDOM from 'react-dom';
// import {createRoot} from 'react-dom';
import {createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {assertConsoleErrorDev, assertConsoleLogsCleared} from 'shared/consoleWithStackDev';
// import {
//   assertConsoleErrorDev,
//   assertConsoleWarnDev,
//   assertConsoleLogsCleared,
// } from 'internal-test-utils';


describe('ReactDOM unknown attribute', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    container = null;
  });

  async function testUnknownAttributeAssignment(value, expectedValue) {
    const root = createRoot(container);
    await act(() => {
      root.render(<div unknown={value} />);
    });
    const el = container.firstChild;
    if (expectedValue == null) {
      expect(el.hasAttribute('unknown')).toBe(false);
    } else {
      expect(el.getAttribute('unknown')).toBe(expectedValue);
    }
  }

  async function testUnknownAttributeRemoval(value) {
    const root = createRoot(container);
    await act(() => {
      root.render(<div unknown={value} />);
    });
    await act(() => {
      root.render(<div />);
    });
  }

  it('removes values null and undefined', async () => {
    await testUnknownAttributeAssignment('something', 'something');
    await testUnknownAttributeAssignment(null, null);
    await testUnknownAttributeAssignment(undefined, null);
  });

  it('changes values true, false to null, and also warns once', async () => {
    await testUnknownAttributeAssignment(true, null);
    assertConsoleErrorDev([
      'Received `true` for a non-boolean attribute `unknown`.\n' +
      'If you want to write it to the DOM, pass a string instead: unknown="true" or unknown={value.toString()}.\n' +
      '    in div (at **)',
    ]);
  });

  it('removes unknown attributes that were rendered but are now missing', async () => {
    const root = createRoot(container);
    await act(() => {
      root.render(<div unknown="hello" />);
    });
    const el = container.firstChild;
    expect(el.getAttribute('unknown')).toBe('hello');

    await act(() => {
      root.render(<div />);
    });
    expect(el.hasAttribute('unknown')).toBe(false);
  });

  it('removes new boolean props', async () => {
    const root = createRoot(container);
    await act(() => {
      root.render(<div download={true} />);
    });
    const el = container.firstChild;
    expect(el.hasAttribute('download')).toBe(true);

    await act(() => {
      root.render(<div download={false} />);
    });
    expect(el.hasAttribute('download')).toBe(false);
  });

  it('warns once for empty strings in new boolean props', async () => {
    const root = createRoot(container);
    let el;
    await act(() => {
      root.render(<div inert={true} />);
    });
    await act(() => {
      root.render(<div inert="" />);
    });
    assertConsoleErrorDev([
      'Received an empty string for a boolean attribute `inert`. ' +
      'This will treat the attribute as if it were false. ' +
      'Either pass `false` to silence this warning, or ' +
      'pass `true` if you used an empty string in earlier ' +
      'versions of React to indicate this attribute is true.\n' +
      '    in div (at **)',
    ]);
    el = container.firstChild;
    expect(el.getAttribute('inert')).toBe(null);
  });

  it('passes through strings', async () => {
    await testUnknownAttributeAssignment('something', 'something');
  });

  it('coerces numbers to strings', async () => {
    await testUnknownAttributeAssignment(42, '42');
  });

  it('coerces NaN to strings and warns', async () => {
    await testUnknownAttributeAssignment(NaN, 'NaN');
    assertConsoleErrorDev([
      'Received `NaN` for the `unknown` attribute. If this is expected, cast the value to a string.\n' +
      '    in div (at **)',
    ]);
  });

  it('coerces objects to strings and warns', async () => {
    const obj = {
      toString() {
        return 'test';
      },
    };
    await testUnknownAttributeAssignment(obj, 'test');
    assertConsoleErrorDev([
      'Received `[object Object]` for the `unknown` attribute. If this is expected, cast the value to a string.\n' +
      '    in div (at **)',
    ]);
  });

  it('throws with Temporal-like objects', async () => {
    const value = {
      [Symbol.toStringTag]: 'TemporalLike',
    };

    const root = createRoot(container);
    const test = async () => {
      await act(() => {
        root.render(<div unknown={value} />);
      });
    };
    await expect(test).rejects.toThrowError(new TypeError('prod message'));
    assertConsoleErrorDev([
      'The provided `unknown` attribute is an unsupported type TemporalLike. This value must be coerced to a string before using it here.\n' +
      '    in div (at **)',
    ]);
  });

  it('removes symbols and warns', async () => {
    await testUnknownAttributeRemoval(Symbol('foo'));
    assertConsoleErrorDev([
      'Invalid value for prop `unknown` on <div> tag. Either remove it from the element, or pass a string or number value to keep it in the DOM. For details, see https://react.dev/link/attribute-behavior\n' +
      '    in div (at **)',
    ]);
  });

  it('removes functions and warns', async () => {
    await testUnknownAttributeRemoval(function someFunction() {});
    assertConsoleErrorDev([
      'Invalid value for prop `unknown` on <div> tag. Either remove it from the element, or pass a string or number value to keep it in the DOM. For details, see https://react.dev/link/attribute-behavior\n' +
      '    in div (at **)',
    ]);
  });

  it('allows camelCase unknown attributes and warns', async () => {
    const root = createRoot(container);
    await act(() => {
      root.render(<div helloWorld="something" />);
    });
    assertConsoleErrorDev([
      'React does not recognize the `helloWorld` prop on a DOM element. ' +
        'If you intentionally want it to appear in the DOM as a custom ' +
        'attribute, spell it as lowercase `helloworld` instead. ' +
        'If you accidentally passed it from a parent component, remove it from the DOM element.\n' +
        '    in div (at **)',
    ]);
  });

  it('ignores value/defaultValue if Symbol or Function is passed', async () => {
    const root = createRoot(container);
    let el;

    await act(() => {
      root.render(<input value={Symbol('test')} onChange={() => {}} />);
    });
    assertConsoleErrorDev([
      'Invalid value for prop `value` on <input> tag. Either remove it from the element, or pass a string or number value to keep it in the DOM. For details, see https://react.dev/link/attribute-behavior\n' +
      '    in input (at **)',
    ]);

    el = container;
    const input1 = el.querySelector('input');
    expect(input1).not.toBeNull();
    expect(input1.hasAttribute('value')).toBe(false);

    await act(() => {
      root.render(<input value={() => {}} onChange={() => {}} />);
    });
    assertConsoleErrorDev([
      'Invalid value for prop `value` on <input> tag. Either remove it from the element, or pass a string or number value to keep it in the DOM. For details, see https://react.dev/link/attribute-behavior\n' +
      '    in input (at **)',
    ]);

    const input2 = el.querySelector('input');
    expect(input2).not.toBeNull();
    expect(input2.hasAttribute('value')).toBe(false);

    assertConsoleLogsCleared();
  });
});