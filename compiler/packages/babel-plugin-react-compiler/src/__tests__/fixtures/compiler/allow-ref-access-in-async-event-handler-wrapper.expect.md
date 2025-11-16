
## Input

```javascript
// @enableInferEventHandlers
import {useRef} from 'react';

// Simulates react-hook-form's handleSubmit
function handleSubmit<T>(callback: (data: T) => void | Promise<void>) {
  return (event: any) => {
    event.preventDefault();
    callback({} as T);
  };
}

// Simulates an upload function
async function upload(file: any): Promise<{blob: {url: string}}> {
  return {blob: {url: 'https://example.com/file.jpg'}};
}

interface SignatureRef {
  toFile(): any;
}

function Component() {
  const ref = useRef<SignatureRef>(null);

  const onSubmit = async (value: any) => {
    // This should be allowed: accessing ref.current in an async event handler
    // that's wrapped and passed to onSubmit prop
    let sigUrl: string;
    if (value.hasSignature) {
      const {blob} = await upload(ref.current?.toFile());
      sigUrl = blob?.url || '';
    } else {
      sigUrl = value.signature;
    }
    console.log('Signature URL:', sigUrl);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input type="text" name="signature" />
      <button type="submit">Submit</button>
    </form>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableInferEventHandlers
import { useRef } from "react";

// Simulates react-hook-form's handleSubmit
function handleSubmit(callback) {
  const $ = _c(2);
  let t0;
  if ($[0] !== callback) {
    t0 = (event) => {
      event.preventDefault();
      callback({} as T);
    };
    $[0] = callback;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

// Simulates an upload function
async function upload(file) {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = { blob: { url: "https://example.com/file.jpg" } };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

interface SignatureRef {
  toFile(): any;
}

function Component() {
  const $ = _c(4);
  const ref = useRef(null);

  const onSubmit = async (value) => {
    let sigUrl;
    if (value.hasSignature) {
      const { blob } = await upload(ref.current?.toFile());
      sigUrl = blob?.url || "";
    } else {
      sigUrl = value.signature;
    }

    console.log("Signature URL:", sigUrl);
  };

  const t0 = handleSubmit(onSubmit);
  let t1;
  let t2;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = <input type="text" name="signature" />;
    t2 = <button type="submit">Submit</button>;
    $[0] = t1;
    $[1] = t2;
  } else {
    t1 = $[0];
    t2 = $[1];
  }
  let t3;
  if ($[2] !== t0) {
    t3 = (
      <form onSubmit={t0}>
        {t1}
        {t2}
      </form>
    );
    $[2] = t0;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <form><input type="text" name="signature"><button type="submit">Submit</button></form>