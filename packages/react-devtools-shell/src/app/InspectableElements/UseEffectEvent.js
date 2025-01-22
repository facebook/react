import * as React from 'react';

const {experimental_useEffectEvent, useState, useEffect} = React;

export default function UseEffectEvent(): React.Node {
  return (
    <>
      <SingleHookCase />
      <HookTreeCase />
    </>
  );
}

function SingleHookCase() {
  const onClick = experimental_useEffectEvent(() => {});

  return <div onClick={onClick} />;
}

function useCustomHook() {
  const [state, setState] = useState();
  const onClick = experimental_useEffectEvent(() => {});
  useEffect(() => {});

  return [state, setState, onClick];
}

function HookTreeCase() {
  const onClick = useCustomHook();

  return <div onClick={onClick} />;
}
