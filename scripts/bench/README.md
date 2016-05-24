Work-in-progress benchmarks.

## Running the suite

```
$ ./measure.py react-a.min.js a.txt react-b.min.js b.txt
$ ./analyze.py a.txt b.txt
```

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
