// @validateNoImpureFunctionsInRender
import {useIdentity} from 'shared-runtime';

function Component() {
  const f = () => Math.random();
  const ref = useRef(f());
  return <div ref={ref} />;
}
