Work-in-progress benchmarks.

## Running the suite

You'll need two folders to compare, each of them containing `react.min.js` and `react-dom-server.min.js`. You can run `npm run build` at the repo root to get a `build` folder with these files.

For example, if you want to compare a stable verion against master, you can create folders called `build-stable` and `build-master` and use the benchmark scripts like this:

```
$ ./measure.py build-stable stable.txt build-master master.txt
$ ./analyze.py stable.txt master.txt
```

The test measurements (second argument to `analyze`, `master.txt` in this example) will be compared to the control measurements (first argument to `analyze`, `stable.txt` in this example).

Changes with the `-` sign in the output mean `master` is faster than `stable`.

You can name folders any way you like, this was just an example.

## Running one
One thing you can do with them is benchmark initial render time for a realistic hierarchy:

```
$ which jsc
/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Resources/jsc
$ jsc react-0.14.0.min.js bench-pe-es5.js -e 'var START=Date.now(); React.renderToString(React.createElement(Benchmark)); var END=Date.now(); print(END-START);'
45
```

Substitute `js` or `v8` for `jsc` to use SpiderMonkey or V8, respectively, if you've installed them.

## Creating one

To create one, copy `extract-component.js` to your clipboard and paste it into the Chrome console on facebook.com, perhaps after changing the root ID if you don't want the tree with ID `.0`.

Then to convert it to ES5:

```
babel --whitelist react,react.displayName --compact false bench-pe.js >bench-pe-es5.js
```
