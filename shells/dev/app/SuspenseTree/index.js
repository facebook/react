// @flow

import React, { Suspense, useState } from 'react';

function SuspenseTree() {
  return (
    <>
      <h1>Suspense</h1>
      <PrimaryFallbackTest />
      <NestedSuspenseTest />
    </>
  );
}

function PrimaryFallbackTest() {
  const [suspend, setSuspend] = useState(false);
  const fallbackStep = useTestSequence('fallback', Fallback1, Fallback2);
  const primaryStep = useTestSequence('primary', Primary1, Primary2);
  return (
    <>
      <h3>Suspense Primary / Fallback</h3>
      <label>
        <input
          checked={suspend}
          onChange={e => setSuspend(e.target.checked)}
          type="checkbox"
        />
        Suspend
      </label>
      <br />
      <Suspense fallback={fallbackStep}>
        {suspend ? <Never /> : primaryStep}
      </Suspense>
    </>
  );
}

function useTestSequence(label, T1, T2) {
  let [step, setStep] = useState(0);
  let next = (
    <button onClick={() => setStep(s => (s + 1) % allSteps.length)}>
      next {label} content
    </button>
  );
  let allSteps = [
    <>{next}</>,
    <>
      {next} <T1 prop={step}>mount</T1>
    </>,
    <>
      {next} <T1 prop={step}>update</T1>
    </>,
    <>
      {next} <T2 prop={step}>several</T2> <T1 prop={step}>different</T1>{' '}
      <T2 prop={step}>children</T2>
    </>,
    <>
      {next} <T2 prop={step}>goodbye</T2>
    </>,
  ];
  return allSteps[step];
}

function NestedSuspenseTest() {
  return (
    <>
      <h3>Nested Suspense</h3>
      <Suspense fallback={<Fallback1>Loading outer</Fallback1>}>
        <Parent />
      </Suspense>
    </>
  );
}

function Parent() {
  return (
    <div>
      <Suspense fallback={<Fallback1>Loading inner 1</Fallback1>}>
        <Primary1>Hello</Primary1>
      </Suspense>{' '}
      <Suspense fallback={<Fallback2>Loading inner 2</Fallback2>}>
        <Primary2>World</Primary2>
      </Suspense>
      <br />
      <Suspense fallback={<Fallback1>This will never load</Fallback1>}>
        <Never />
      </Suspense>
      <br />
      <b>
        <LoadLater />
      </b>
    </div>
  );
}

function LoadLater() {
  const [loadChild, setLoadChild] = useState(0);
  return (
    <Suspense
      fallback={
        <Fallback1 onClick={() => setLoadChild(true)}>Click to load</Fallback1>
      }
    >
      {loadChild ? (
        <Primary1 onClick={() => setLoadChild(false)}>
          Loaded! Click to suspend again.
        </Primary1>
      ) : (
        <Never />
      )}
    </Suspense>
  );
}

function Never() {
  throw new Promise(resolve => {});
}

function Fallback1({ prop, ...rest }) {
  return <span {...rest} />;
}

function Fallback2({ prop, ...rest }) {
  return <span {...rest} />;
}

function Primary1({ prop, ...rest }) {
  return <span {...rest} />;
}

function Primary2({ prop, ...rest }) {
  return <span {...rest} />;
}

export default SuspenseTree;
