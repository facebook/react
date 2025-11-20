// @validateExhaustiveMemoizationDependencies
import {useMemo} from 'react';
import {makeObject_Primitives, Stringify} from 'shared-runtime';

function Component({x, y, z}) {
  const a = useMemo(() => {
    return x?.y.z?.a;
  }, [x?.y.z?.a]);
  const b = useMemo(() => {
    return x.y.z?.a;
  }, [x.y.z?.a]);
  const c = useMemo(() => {
    return x?.y.z.a?.b;
  }, [x?.y.z.a?.b]);
  const d = useMemo(() => {
    return x?.y?.[(console.log(y), z?.b)];
  }, [x?.y, y, z?.b]);
  const e = useMemo(() => {
    const e = [];
    const local = makeObject_Primitives(x);
    const fn = () => {
      e.push(local);
    };
    fn();
    return e;
  }, [x]);
  const f = useMemo(() => {
    const f = [];
    f.push(x.y.z);
    f.push(x.y);
    f.push(x);
    return f;
  }, [x]);
  return <Stringify results={[a, b, c, d, e, f]} />;
}
