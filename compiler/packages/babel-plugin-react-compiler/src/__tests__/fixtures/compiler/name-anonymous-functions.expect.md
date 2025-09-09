
## Input

```javascript
// @enableNameAnonymousFunctions

import {useEffect} from 'react';
import {identity, Stringify, useIdentity} from 'shared-runtime';
import * as SharedRuntime from 'shared-runtime';

function Component(props) {
  function named() {
    const inner = () => props.named;
    return inner();
  }
  const namedVariable = function () {
    return props.namedVariable;
  };
  const methodCall = SharedRuntime.identity(() => props.methodCall);
  const call = identity(() => props.call);
  const builtinElementAttr = <div onClick={() => props.builtinElementAttr} />;
  const namedElementAttr = <Stringify onClick={() => props.namedElementAttr} />;
  const hookArgument = useIdentity(() => props.hookArgument);
  useEffect(() => {
    console.log(props.useEffect);
    JSON.stringify(null, null, () => props.useEffect);
    const g = () => props.useEffect;
    console.log(g());
  }, [props.useEffect]);
  return (
    <>
      {named()}
      {namedVariable()}
      {methodCall()}
      {call()}
      {builtinElementAttr}
      {namedElementAttr}
      {hookArgument()}
    </>
  );
}

export const TODO_FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [
    {
      named: '<named>',
      namedVariable: '<namedVariable>',
      methodCall: '<methodCall>',
      call: '<call>',
      builtinElementAttr: '<builtinElementAttr>',
      namedElementAttr: '<namedElementAttr>',
      hookArgument: '<hookArgument>',
      useEffect: '<useEffect>',
    },
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableNameAnonymousFunctions

import { useEffect } from "react";
import { identity, Stringify, useIdentity } from "shared-runtime";
import * as SharedRuntime from "shared-runtime";

function Component(props) {
  const $ = _c(31);
  let t0;
  if ($[0] !== props.named) {
    t0 = function named() {
      const inner = { "Component[named > inner]": () => props.named }[
        "Component[named > inner]"
      ];
      return inner();
    };
    $[0] = props.named;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const named = t0;
  let t1;
  if ($[2] !== props.namedVariable) {
    t1 = {
      "Component[namedVariable]": function () {
        return props.namedVariable;
      },
    }["Component[namedVariable]"];
    $[2] = props.namedVariable;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const namedVariable = t1;
  let t2;
  if ($[4] !== props.methodCall) {
    t2 = { "Component[SharedRuntime.identity()]": () => props.methodCall }[
      "Component[SharedRuntime.identity()]"
    ];
    $[4] = props.methodCall;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  const methodCall = SharedRuntime.identity(t2);
  let t3;
  if ($[6] !== props.call) {
    t3 = { "Component[identity()]": () => props.call }["Component[identity()]"];
    $[6] = props.call;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  const call = identity(t3);
  let t4;
  if ($[8] !== props.builtinElementAttr) {
    t4 = (
      <div
        onClick={
          { "Component[<div>.onClick]": () => props.builtinElementAttr }[
            "Component[<div>.onClick]"
          ]
        }
      />
    );
    $[8] = props.builtinElementAttr;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  const builtinElementAttr = t4;
  let t5;
  if ($[10] !== props.namedElementAttr) {
    t5 = (
      <Stringify
        onClick={
          { "Component[<Stringify>.onClick]": () => props.namedElementAttr }[
            "Component[<Stringify>.onClick]"
          ]
        }
      />
    );
    $[10] = props.namedElementAttr;
    $[11] = t5;
  } else {
    t5 = $[11];
  }
  const namedElementAttr = t5;
  let t6;
  if ($[12] !== props.hookArgument) {
    t6 = { "Component[useIdentity()]": () => props.hookArgument }[
      "Component[useIdentity()]"
    ];
    $[12] = props.hookArgument;
    $[13] = t6;
  } else {
    t6 = $[13];
  }
  const hookArgument = useIdentity(t6);
  let t7;
  let t8;
  if ($[14] !== props.useEffect) {
    t7 = {
      "Component[useEffect()]": () => {
        console.log(props.useEffect);
        JSON.stringify(
          null,
          null,
          {
            "Component[useEffect() > JSON.stringify()]": () => props.useEffect,
          }["Component[useEffect() > JSON.stringify()]"],
        );
        const g = { "Component[useEffect() > g]": () => props.useEffect }[
          "Component[useEffect() > g]"
        ];
        console.log(g());
      },
    }["Component[useEffect()]"];
    t8 = [props.useEffect];
    $[14] = props.useEffect;
    $[15] = t7;
    $[16] = t8;
  } else {
    t7 = $[15];
    t8 = $[16];
  }
  useEffect(t7, t8);
  let t9;
  if ($[17] !== named) {
    t9 = named();
    $[17] = named;
    $[18] = t9;
  } else {
    t9 = $[18];
  }
  let t10;
  if ($[19] !== namedVariable) {
    t10 = namedVariable();
    $[19] = namedVariable;
    $[20] = t10;
  } else {
    t10 = $[20];
  }
  const t11 = methodCall();
  const t12 = call();
  let t13;
  if ($[21] !== hookArgument) {
    t13 = hookArgument();
    $[21] = hookArgument;
    $[22] = t13;
  } else {
    t13 = $[22];
  }
  let t14;
  if (
    $[23] !== builtinElementAttr ||
    $[24] !== namedElementAttr ||
    $[25] !== t10 ||
    $[26] !== t11 ||
    $[27] !== t12 ||
    $[28] !== t13 ||
    $[29] !== t9
  ) {
    t14 = (
      <>
        {t9}
        {t10}
        {t11}
        {t12}
        {builtinElementAttr}
        {namedElementAttr}
        {t13}
      </>
    );
    $[23] = builtinElementAttr;
    $[24] = namedElementAttr;
    $[25] = t10;
    $[26] = t11;
    $[27] = t12;
    $[28] = t13;
    $[29] = t9;
    $[30] = t14;
  } else {
    t14 = $[30];
  }
  return t14;
}

export const TODO_FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [
    {
      named: "<named>",
      namedVariable: "<namedVariable>",
      methodCall: "<methodCall>",
      call: "<call>",
      builtinElementAttr: "<builtinElementAttr>",
      namedElementAttr: "<namedElementAttr>",
      hookArgument: "<hookArgument>",
      useEffect: "<useEffect>",
    },
  ],
};

```
      
### Eval output
(kind: exception) Fixture not implemented