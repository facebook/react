import React, {useEffect, useMemo, useState} from 'react';

export default function Component({foo}) {
  const memoizedFoo = useMemo(
    () => ({
      foo,
    }),
    [foo],
  );

  useEffect(() => {
    // Not named
  });

  const custom = useCustomHook();

  return <div>{memoizedFoo + custom}</div>;
}

function useCustomHook() {
  const [stateValue] = useState(true);

  return stateValue;
}
