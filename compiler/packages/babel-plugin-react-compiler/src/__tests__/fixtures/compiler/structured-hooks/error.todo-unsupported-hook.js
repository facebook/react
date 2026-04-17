// @enableEmitStructuredHooks @target:"18"

import {useEffect} from 'react';

function Foo(props) {
  'use structured hooks';

  useEffect(() => {
    console.log(props.label);
  }, [props.label]);

  return <div>{props.label}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{label: 'Ada'}],
};