// @flow

import React, { useCallback, useState } from 'react';

type Props = {|
  initialCount: number,
|};

export default function FunctionWithState({ initialCount }: Props) {
  const [count, setCount] = useState(initialCount);
  const handleClick = useCallback(() => {
    setCount(count => count + 1);
  });

  return <button onClick={handleClick}>Count {count}</button>;
}
