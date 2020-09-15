/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';

const object = {
  string: 'abc',
  longString: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKJLMNOPQRSTUVWXYZ1234567890',
  emptyString: '',
  number: 123,
  boolean: true,
  undefined: undefined,
  null: null,
};

export default function ObjectProps() {
  return (
    <ChildComponent
      object={{
        outer: {
          inner: object,
        },
      }}
      array={['first', 'second', 'third']}
      objectInArray={[object]}
      arrayInObject={{array: ['first', 'second', 'third']}}
      deepObject={{
        // Known limitation: we won't go deeper than several levels.
        // In the future, we might offer a way to request deeper access on demand.
        a: {
          b: {
            c: {
              d: {
                e: {
                  f: {
                    g: {
                      h: {
                        i: {
                          j: 10,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }}
      emptyArray={[]}
      emptyObject={{}}
    />
  );
}

function ChildComponent(props: any) {
  return null;
}
