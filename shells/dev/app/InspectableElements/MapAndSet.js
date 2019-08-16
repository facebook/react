// @flow

import React from 'react';

const set = new Set();
set.add('abc');
set.add(123);

const map = new Map();
map.set('name', 'Brian');
map.set('food', 'sushi');

export default function MapAndSet() {
  return <ChildComponent map={map} set={set} />;
}

function ChildComponent(props: any) {
  return null;
}
