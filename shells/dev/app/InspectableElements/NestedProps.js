// @flow

import React from 'react';

export default function ObjectProps() {
  return (
    <ChildComponent
      object={{
        outer: {
          inner: {
            string: 'abc',
            number: 123,
            boolean: true,
          },
        },
      }}
      array={['first', 'second', 'third']}
      objectInArray={[
        {
          string: 'abc',
          number: 123,
          boolean: true,
        },
      ]}
      arrayInObject={{ array: ['first', 'second', 'third'] }}
    />
  );
}

function ChildComponent(props: any) {
  return null;
}
