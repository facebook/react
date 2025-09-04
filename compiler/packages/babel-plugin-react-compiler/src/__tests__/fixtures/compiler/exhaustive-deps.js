//

import {useMemo} from 'react';
import {Stringify} from 'shared-runtime';

function Component({x}) {
  const DEBUG = false;
  const y = useMemo(() => {
    return () => x.y;
  }, [x.y]);
  return <Stringify y={y} />;
}
