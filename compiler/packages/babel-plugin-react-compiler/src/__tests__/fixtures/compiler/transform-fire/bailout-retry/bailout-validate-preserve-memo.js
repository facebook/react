// @validatePreserveExistingMemoizationGuarantees @enableFire
import {fire} from 'react';
import {sum} from 'shared-runtime';

function Component({prop1, bar}) {
  const foo = () => {
    console.log(prop1);
  };
  useEffect(() => {
    fire(foo(prop1));
    fire(foo());
    fire(bar());
  });

  return useMemo(() => sum(bar), []);
}
