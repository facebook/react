// @flow

import React from 'react';

class Custom {
  _number = 42;
  get number() {
    return this._number;
  }
}

export default function CustomObject() {
  return <ChildComponent customObject={new Custom()} />;
}

function ChildComponent(props: any) {
  return null;
}
