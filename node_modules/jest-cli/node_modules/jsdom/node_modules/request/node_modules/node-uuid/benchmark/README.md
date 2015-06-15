# node-uuid Benchmarks

### Results

To see the results of our benchmarks visit https://github.com/broofa/node-uuid/wiki/Benchmark

### Run them yourself

node-uuid comes with some benchmarks to measure performance of generating UUIDs. These can be run using node.js. node-uuid is being benchmarked against some other uuid modules, that are available through npm namely `uuid` and `uuid-js`.

To prepare and run the benchmark issue;

```
npm install uuid uuid-js
node benchmark/benchmark.js
```

You'll see an output like this one:

```
# v4
nodeuuid.v4(): 854700 uuids/second
nodeuuid.v4('binary'): 788643 uuids/second
nodeuuid.v4('binary', buffer): 1336898 uuids/second
uuid(): 479386 uuids/second
uuid('binary'): 582072 uuids/second
uuidjs.create(4): 312304 uuids/second

# v1
nodeuuid.v1(): 938086 uuids/second
nodeuuid.v1('binary'): 683060 uuids/second
nodeuuid.v1('binary', buffer): 1644736 uuids/second
uuidjs.create(1): 190621 uuids/second
```

* The `uuid()` entries are for Nikhil Marathe's [uuid module](https://bitbucket.org/nikhilm/uuidjs) which is a wrapper around the native libuuid library.
* The `uuidjs()` entries are for Patrick Negri's [uuid-js module](https://github.com/pnegri/uuid-js) which is a pure javascript implementation based on [UUID.js](https://github.com/LiosK/UUID.js) by LiosK.

If you want to get more reliable results you can run the benchmark multiple times and write the output into a log file:

```
for i in {0..9}; do node benchmark/benchmark.js >> benchmark/bench_0.4.12.log; done;
```

If you're interested in how performance varies between different node versions, you can issue the above command multiple times.

You can then use the shell script `bench.sh` provided in this directory to calculate the averages over all benchmark runs and draw a nice plot:

```
(cd benchmark/ && ./bench.sh)
```

This assumes you have [gnuplot](http://www.gnuplot.info/) and [ImageMagick](http://www.imagemagick.org/) installed. You'll find a nice `bench.png` graph in the `benchmark/` directory then.
