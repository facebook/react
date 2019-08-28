Harness for testing local changes to the `react-devtools-inline` and `react-devtools-shared` packages.

## Development

This target should be run in parallel with the `react-devtools-inline` package. The first step then is to watch for changes to that target:
```sh
cd packages/react-devtools-inline 

yarn start
```

Next, watch for changes to the test harness:
```sh
cd packages/react-devtools-shell

yarn start
```
