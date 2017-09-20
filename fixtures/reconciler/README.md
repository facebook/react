
To test, run:
* `yarn install` 
* edit node_modules/react-reconciler/cjs/react-reconciler.development.js 
* Add the below snipper after `var valueStack = [];`
* `yarn test`

If everything is okay then you should see `Ok!` printed to the console.


```
if (global.valueStacks === undefined) {
  global.valueStacks = [];
}
global.valueStacks.push(valueStack);
```
