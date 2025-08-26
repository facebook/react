// @validateNoDerivedComputationsInEffects
import {useState, useEffect} from 'react';

function Component({props, number}) {
  const nothing = 0;
  const missDirection = number;
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    setDisplayValue(props.prefix + missDirection + nothing);
  }, [props.prefix, missDirection, nothing]);

  return (
    <div
      onClick={() => {
        setDisplayValue('clicked');
      }}>
      {displayValue}
    </div>
  );
}
