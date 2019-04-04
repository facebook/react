// @flow

import React, { Suspense, useState } from 'react';

function SuspenseTree() {
  return (
    <>
      <h1>Suspense</h1>
      <Suspense fallback={<Fallback>Loading outer</Fallback>}>
        <Parent />
      </Suspense>
    </>
  );
}

function Parent() {
  return (
    <div>
      <Suspense fallback={<Fallback>Loading inner 1</Fallback>}>
        <Child>Hello</Child>
      </Suspense>
      <Suspense fallback={<Fallback>Loading inner 2</Fallback>}>
        <Child>World</Child>
      </Suspense>
      <Suspense fallback={<Fallback>This will never load</Fallback>}>
        <Never />
      </Suspense>
      <LoadLater />
    </div>
  );
}

function LoadLater() {
  const [loadChild, setLoadChild] = useState(0);
  return (
    <Suspense
      fallback={
        <Fallback onClick={() => setLoadChild(true)}>Click to load</Fallback>
      }
    >
      {loadChild ? (
        <Child onClick={() => setLoadChild(false)}>
          Loaded! Click to suspend again.
        </Child>
      ) : (
        <Never />
      )}
    </Suspense>
  );
}

function Child(props) {
  return <p {...props} />;
}

function Fallback(props) {
  return <h3 {...props}>{props.children}</h3>;
}

function Never() {
  throw new Promise(resolve => {});
}

export default SuspenseTree;
