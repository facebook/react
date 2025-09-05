import {useMemo} from 'react';
import {Stringify} from 'shared-runtime';

function Component({x, y, z}) {
  // const a = useMemo(() => {
  //   return x?.y.z?.a;
  // }, [x?.y.z?.a]);
  // const b = useMemo(() => {
  //   return x.y.z?.a;
  // }, [x.y.z?.a]);
  // const c = useMemo(() => {
  //   return x?.y.z.a?.b;
  // }, [x?.y.z.a?.b]);
  const d = useMemo(() => {
    return x?.y?.[y ?? z?.b];
  }, [x?.y, y, z?.b]);
  const a = 0;
  const b = 1;
  const c = 2;
  return <Stringify results={[a, b, c, d]} />;
}
