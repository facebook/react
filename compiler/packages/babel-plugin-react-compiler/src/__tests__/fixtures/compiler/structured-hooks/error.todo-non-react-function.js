// @enableEmitStructuredHooks @target:"18"

import {useState} from 'react';

function makeLabel() {
  'use structured hooks';

  const [label] = useState('Ada');
  return label;
}

export const FIXTURE_ENTRYPOINT = {
  fn: makeLabel,
  params: [],
};