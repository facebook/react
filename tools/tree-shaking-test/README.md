Rollup tree-shaking test
------------------------

The purpose of this test is to verify how much stuff can be tree-shaken from our packages.

The test generates an empty js file that imports everything from a particular package but doesn't
use any of the imported references.

In the ideal scenario Rollup should detect that none of the references are being used and should
create an empty bundle file.

In reality there is a lot of stuff preserved in the bundle because Rollup is currently not able to
make a safe decision to remove many of the unused symbols.

To run execute: `./tools/tree-shaking-test/test.sh`

then inspect `dist/tree-shaking/test/**/*.bundle.js`
