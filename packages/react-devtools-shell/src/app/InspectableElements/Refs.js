/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';

const ForwardRefComponent = React.forwardRef(function ForwardRefComponent(
  props,
  ref,
) {
  return <div ref={ref} />;
});

class ClassComponent extends React.Component {
  render() {
    return null;
  }
}

export default function Refs() {
  const hostRef = React.useRef(null);
  const classComponentRef = React.useRef(null);
  const forwardRefComponentRef = React.useRef(null);

  return (
    <React.Fragment>
      <div data-testid="has-no-ref" />
      <div ref={hostRef} />
      <div ref={() => {}} />
      <ClassComponent ref={classComponentRef} />
      <ForwardRefComponent ref={forwardRefComponentRef} />
    </React.Fragment>
  );
}
