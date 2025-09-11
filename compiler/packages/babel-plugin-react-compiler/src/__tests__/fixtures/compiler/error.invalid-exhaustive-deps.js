// @validateExhaustiveMemoizationDependencies
import {useMemo} from 'react';
import {Stringify} from 'shared-runtime';

function Component({x, y, z}) {
  const a = useMemo(() => {
    return x?.y.z?.a;
  }, [x?.y.z?.a.b]);
  const b = useMemo(() => {
    return x.y.z?.a;
  }, [x.y.z.a]);
  const c = useMemo(() => {
    return x?.y.z.a?.b;
  }, [x?.y.z.a?.b.z]);
  const d = useMemo(() => {
    return x?.y?.[(console.log(y), z?.b)];
  }, [x?.y, y, z?.b]);
  const e = useMemo(() => {
    const e = [];
    e.push(x);
    return e;
  }, [x]);
  const f = useMemo(() => {
    return [];
  }, [x, y.z, z?.y?.a, UNUSED_GLOBAL]);
  const ref1 = useRef(null);
  const ref2 = useRef(null);
  const ref = z ? ref1 : ref2;
  const cb = useMemo(() => {
    return () => {
      return ref.current;
    };
  }, []);
  return <Stringify results={[a, b, c, d, e, f, cb]} />;
}
