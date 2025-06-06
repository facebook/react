
## Input

```javascript
function Component() {
  let local;

  const reassignLocal = newValue => {
    local = newValue;
  };

  const onClick = newValue => {
    reassignLocal('hello');

    if (local === newValue) {
      // Without React Compiler, `reassignLocal` is freshly created
      // on each render, capturing a binding to the latest `local`,
      // such that invoking reassignLocal will reassign the same
      // binding that we are observing in the if condition, and
      // we reach this branch
      console.log('`local` was updated!');
    } else {
      // With React Compiler enabled, `reassignLocal` is only created
      // once, capturing a binding to `local` in that render pass.
      // Therefore, calling `reassignLocal` will reassign the wrong
      // version of `local`, and not update the binding we are checking
      // in the if condition.
      //
      // To protect against this, we disallow reassigning locals from
      // functions that escape
      throw new Error('`local` not updated!');
    }
  };

  return <button onClick={onClick}>Submit</button>;
}

```


## Error

```
  29 |   };
  30 |
> 31 |   return <button onClick={onClick}>Submit</button>;
     |                           ^^^^^^^ InvalidReact: This argument is a function which may reassign or mutate local variables after render, which can cause inconsistent behavior on subsequent renders. Consider using state instead (31:31)

InvalidReact: The function modifies a local variable here (5:5)
  32 | }
  33 |

ReactCompilerError: InvalidReact: This argument is a function which may reassign or mutate local variables after render, which can cause inconsistent behavior on subsequent renders. Consider using state instead (31:31)

InvalidReact: The function modifies a local variable here (5:5)
    at validateNoFreezingKnownMutableFunctions (/Users/joesavona/github/react/compiler/packages/babel-plugin-react-compiler/dist/index.js:113829:18)
    at runWithEnvironment (/Users/joesavona/github/react/compiler/packages/babel-plugin-react-compiler/dist/index.js:114076:7)
    at run (/Users/joesavona/github/react/compiler/packages/babel-plugin-react-compiler/dist/index.js:113959:10)
    at compileFn (/Users/joesavona/github/react/compiler/packages/babel-plugin-react-compiler/dist/index.js:114301:10)
    at tryCompileFunction (/Users/joesavona/github/react/compiler/packages/babel-plugin-react-compiler/dist/index.js:114793:19)
    at processFn (/Users/joesavona/github/react/compiler/packages/babel-plugin-react-compiler/dist/index.js:114730:25)
    at compileProgram (/Users/joesavona/github/react/compiler/packages/babel-plugin-react-compiler/dist/index.js:114638:22)
    at PluginPass.enter (/Users/joesavona/github/react/compiler/packages/babel-plugin-react-compiler/dist/index.js:115773:26)
    at newFn (/Users/joesavona/github/react/compiler/node_modules/@babel/traverse/lib/visitors.js:172:14)
    at NodePath._call (/Users/joesavona/github/react/compiler/node_modules/@babel/traverse/lib/path/context.js:49:20)
    at NodePath.call (/Users/joesavona/github/react/compiler/node_modules/@babel/traverse/lib/path/context.js:39:18)
    at NodePath.visit (/Users/joesavona/github/react/compiler/node_modules/@babel/traverse/lib/path/context.js:88:31)
    at TraversalContext.visitQueue (/Users/joesavona/github/react/compiler/node_modules/@babel/traverse/lib/context.js:90:16)
    at TraversalContext.visitSingle (/Users/joesavona/github/react/compiler/node_modules/@babel/traverse/lib/context.js:66:19)
    at TraversalContext.visit (/Users/joesavona/github/react/compiler/node_modules/@babel/traverse/lib/context.js:113:19)
    at traverseNode (/Users/joesavona/github/react/compiler/node_modules/@babel/traverse/lib/traverse-node.js:22:17)
    at traverse (/Users/joesavona/github/react/compiler/node_modules/@babel/traverse/lib/index.js:53:34)
    at transformFile (/Users/joesavona/github/react/compiler/node_modules/@babel/core/lib/transformation/index.js:80:31)
    at transformFile.next (<anonymous>)
    at run (/Users/joesavona/github/react/compiler/node_modules/@babel/core/lib/transformation/index.js:25:12)
    at run.next (<anonymous>)
    at /Users/joesavona/github/react/compiler/node_modules/@babel/core/lib/transform-ast.js:23:33
    at Generator.next (<anonymous>)
    at evaluateSync (/Users/joesavona/github/react/compiler/node_modules/gensync/index.js:251:28)
    at sync (/Users/joesavona/github/react/compiler/node_modules/gensync/index.js:89:14)
    at stopHiding - secret - don't use this - v1 (/Users/joesavona/github/react/compiler/node_modules/@babel/core/lib/errors/rewrite-stack-trace.js:47:12)
    at transformFromAstSync (/Users/joesavona/github/react/compiler/node_modules/@babel/core/lib/transform-ast.js:43:83)
    at /Users/joesavona/github/react/compiler/packages/snap/dist/compiler.js:204:62
    at Generator.next (<anonymous>)
    at /Users/joesavona/github/react/compiler/packages/snap/dist/compiler.js:37:71
    at new Promise (<anonymous>)
    at __awaiter (/Users/joesavona/github/react/compiler/packages/snap/dist/compiler.js:33:12)
    at transformFixtureInput (/Users/joesavona/github/react/compiler/packages/snap/dist/compiler.js:186:12)
    at /Users/joesavona/github/react/compiler/packages/snap/dist/runner-worker.js:97:71
    at Generator.next (<anonymous>)
    at /Users/joesavona/github/react/compiler/packages/snap/dist/runner-worker.js:14:71
    at new Promise (<anonymous>)
    at __awaiter (/Users/joesavona/github/react/compiler/packages/snap/dist/runner-worker.js:10:12)
    at compile (/Users/joesavona/github/react/compiler/packages/snap/dist/runner-worker.js:44:12)
    at Object.<anonymous> (/Users/joesavona/github/react/compiler/packages/snap/dist/runner-worker.js:163:48)
    at Generator.next (<anonymous>)
    at /Users/joesavona/github/react/compiler/packages/snap/dist/runner-worker.js:14:71
    at new Promise (<anonymous>)
    at __awaiter (/Users/joesavona/github/react/compiler/packages/snap/dist/runner-worker.js:10:12)
    at Object.transformFixture (/Users/joesavona/github/react/compiler/packages/snap/dist/runner-worker.js:148:12)
    at execFunction (/Users/joesavona/github/react/compiler/node_modules/jest-worker/build/workers/threadChild.js:148:17)
    at execHelper (/Users/joesavona/github/react/compiler/node_modules/jest-worker/build/workers/threadChild.js:127:5)
    at execMethod (/Users/joesavona/github/react/compiler/node_modules/jest-worker/build/workers/threadChild.js:131:5)
    at MessagePort.messageListener (/Users/joesavona/github/react/compiler/node_modules/jest-worker/build/workers/threadChild.js:49:7)
    at [nodejs.internal.kHybridDispatch] (node:internal/event_target:827:20)
```
          
      