// @validatePreserveExistingMemoizationGuarantees:false
import {useState, useEffect} from 'react';

/**
 * Regression test for: React Compiler removes optional chaining due to
 * incorrect non-null assumption from a conditionally-called inner function
 * inside useEffect.
 *
 * The compiler was incorrectly assuming `currentDevice` is always non-null
 * because `currentDevice.os` is accessed inside `log()`. However, `log()` is
 * only called when `currentDevice` is truthy — so this access does NOT prove
 * non-nullability in the outer scope.
 *
 * The compiled output must preserve `currentDevice?.type` and
 * `currentDevice?.os` as optional chains.
 */
export default function Scanner() {
  const [devices, setDevices] = useState([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);

  const currentDevice = devices[currentDeviceIndex];

  useEffect(() => {
    async function log() {
      console.log(currentDevice.os);
    }
    if (currentDevice) log();
  }, [currentDevice]);

  return (
    <div>
      device type:{' '}
      {currentDevice?.type ||
        (currentDevice?.os?.match(/android|ios/i) ? 'mobile' : 'desktop')}
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Scanner,
  params: [{}],
};
