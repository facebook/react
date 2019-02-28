// @flow

import React from 'react';

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
      arrayInObject={{ array: ['first', 'second', 'third'] }}
    />
  );
}

function ChildComponent(props: any) {
  return null;
}
