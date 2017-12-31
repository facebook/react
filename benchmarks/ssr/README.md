# Vue.js SSR benchmark

This benchmark renders a table of 1000 rows with 10 columns (10k components), with around 30k normal elements on the page. Note this is not something likely to be seen in a typical app. This benchmark is mostly for stress/regression testing and comparing between `renderToString` and `renderToStream`.

To view the results follow the run section. Note that the overall completion time for the results are variable, this is due to other system related variants at run time (available memory, processing power, etc). In ideal circumstances both should finish within similar results.

`renderToStream` pipes the content through a stream which provides considerable performance benefits (faster time-to-first-byte and non-event-loop-blocking) over `renderToString`. This can be observed through the benchmark.

### run

``` bash
npm run bench:ssr
```
