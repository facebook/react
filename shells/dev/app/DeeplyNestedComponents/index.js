// @flow

import React, { Fragment } from 'react';

function wrapWithHoc(Component, index) {
  function HOC() {
    return <Component />;
  }
  HOC.displayName = `withHoc${index}(${Component.displayName ||
    Component.name})`;
  return HOC;
}

function wrapWithNested(Component, times) {
  for (let i = 0; i < times; i++) {
    Component = wrapWithHoc(Component, i);
  }

  return Component;
}

function Nested() {
  return <div>Deeply nested div</div>;
}

const DeeplyNested = wrapWithNested(Nested, 100);

export default function DeeplyNestedComponents() {
  return (
    <Fragment>
      <h1>Deeply nested component</h1>
      <DeeplyNested />
    </Fragment>
  );
}
