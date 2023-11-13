
## Input

```javascript
// @validateNoSetStateInRenderFunctionExpressions
function Component(props) {
  const logEvent = useLogging(props.appId);
  const [currentStep, setCurrentStep] = useState(0);

  // onSubmit gets the same mutable range as `logEvent`, since that is called
  // later. however, our validation uses direct aliasing to track function
  // expressions which are invoked, and understands that this function isn't
  // called during render:
  const onSubmit = (errorEvent) => {
    logEvent(errorEvent);
    setCurrentStep(1);
  };

  switch (currentStep) {
    case 0:
      return <OtherComponent data={{ foo: "bar" }} />;
    case 1:
      return <OtherComponent data={{ foo: "joe" }} onSubmit={onSubmit} />;
    default:
      // 1. logEvent's mutable range is extended to this instruction
      logEvent("Invalid step");
      return <OtherComponent data={null} />;
  }
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @validateNoSetStateInRenderFunctionExpressions
function Component(props) {
  const $ = useMemoCache(3);
  const logEvent = useLogging(props.appId);
  const [currentStep, setCurrentStep] = useState(0);

  const onSubmit = (errorEvent) => {
    logEvent(errorEvent);
    setCurrentStep(1);
  };
  switch (currentStep) {
    case 0: {
      let t0;
      if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = <OtherComponent data={{ foo: "bar" }} />;
        $[0] = t0;
      } else {
        t0 = $[0];
      }
      return t0;
    }
    case 1: {
      let t1;
      if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = { foo: "joe" };
        $[1] = t1;
      } else {
        t1 = $[1];
      }
      return <OtherComponent data={t1} onSubmit={onSubmit} />;
    }
    default: {
      logEvent("Invalid step");
      let t2;
      if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = <OtherComponent data={null} />;
        $[2] = t2;
      } else {
        t2 = $[2];
      }
      return t2;
    }
  }
}

```
      