// @enableEmitStructuredHooks @target:"18"

import {useState} from 'react';

function Foo(props) {
  'use structured hooks';

  if (props.showDetail) {
    const [label] = useState('Ada');
    return <div>{label}</div>;
  }

  return <div>hidden</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{showDetail: true}],
};
