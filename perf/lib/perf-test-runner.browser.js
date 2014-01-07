if (typeof console == 'undefined') console = {
  log: function(){},
  warn: function(){},
  error: function(){},
  debug: function(){}
};

var perfRunner;
if (typeof exports == 'object') {
  perfRunner = exports;
} else {
  perfRunner = {};
}

perfRunner.assert = function(test, message){
  if (typeof test == 'function') test = test();
  if (test) return;
  throw Error(message);
}

perfRunner.WriteScript = function(props){
  var type = '';
  if (props.jsx) {
    type = ' type="text/jsx"';
  }
  var src = props.src;
  if (!props.cache) {
    src += src.indexOf('?') === -1 ? '?_' : '&_';
    src += perfRunner.WriteScript.cacheBust;
  }
  document.write('<script' + type + ' src="' + src + '"><\/script>');
}
perfRunner.WriteScript.cacheBust = (+new Date).toString(36);

perfRunner.WriteReactLibScript = function(params){
  var src;
  var minSuffix;
  if (params.debug) {
    minSuffix = '';
  } else {
    minSuffix = '.min';
  }
  
  if (params.version && typeof params.version != 'string') throw TypeError("Expected 'version' to be a string");
  
  if (params.version == 'edge' || !params.version) {
    console.log('React edge (local)');
    perfRunner.WriteScript({src:'../build/react' + minSuffix + '.js'});
    perfRunner.WriteScript({src:'../build/JSXTransformer.js'});
  } else if (params.version == 'previous') {
    console.log('React previous (local)');
    perfRunner.WriteScript({cache:true, src:'../build/react-previous' + minSuffix + '.js'});
    perfRunner.WriteScript({cache:true, src:'../build/JSXTransformer-previous.js'});
  } else if (params.version.indexOf('builds/') === 0) {
    perfRunner.WriteScript({cache:true, src:'http://react.zpao.com/' + params.version + '/react' + minSuffix + '.js'});
    perfRunner.WriteScript({cache:true, src:'http://react.zpao.com/' + params.version + '/JSXTransformer.js'});
  } else {
    console.log('React ' + params.version);
    perfRunner.WriteScript({cache:true, src:'http://fb.me/react-' + params.version + minSuffix + '.js'});
    perfRunner.WriteScript({cache:true, src:'http://fb.me/JSXTransformer-' + params.version + '.js'});
  }
  if (params.debug) {
    console.warn('Loading the unminified build of React, performance may suffer.');
    console.warn('Load "' + location.href.replace(/\bdebug=\w+&?|&\bdebug=\w+/ig, '') + '" for better perf.');
  } else {
    console.warn('Loading the minified build of React, debugging may be harder.');
    console.warn('Load "' + location.href.replace(/\bdebug=\w+&?|&\bdebug=\w+/ig, '') + '&debug=1' + '" for easier debugging.');
  }
}

perfRunner.WriteTestScript = function(params){
  if (Array.isArray(params.test)) {
    return params.test
      .map(function(test){return {test:test};})
      .map(perfRunner.WriteTestScript)
    ;
  }
  perfRunner.assert(params.test.indexOf('..') === -1, 'no relative paths allowed');
  return perfRunner.WriteScript({jsx:true, src: './tests/' + params.test});
}

perfRunner.getQueryParamArray = function(key){
  var values;
  var queryString = location.search.substr(1);
  var _key = encodeURIComponent(key) + '=';
  
  if (queryString.indexOf(_key) > -1) {
    values = queryString
      .split(_key)
      .slice(1)
      .map(function(part){return part.split('&')[0];})
      .map(decodeURIComponent)
      .map(function(string){
        try {
          return JSON.parse(string);
        } catch(e){}
        return string;
      })
    ;
  }
  
  perfRunner.assert(values && values.length && values[0], 'expected ' + key + ' query param');
  return values;
}

perfRunner.getQueryParamArrayOrDefault = function(key, defaultValue){
  try {
    return perfRunner.getQueryParamArray(key);
  } catch (e) {}
  return defaultValue;
}

perfRunner.Polyfill = function(){
  if (typeof Function.prototype.bind != 'undefined') return;
  perfRunner.WriteScript({src:'/node_modules/es5-shim/es5-shim.js', cache:true});
  perfRunner.WriteScript({src:'/node_modules/es5-shim/es5-sham.js', cache:true});
}

perfRunner.BenchmarkResults = function(props){
  return perfRunner.roundNumberWithPrecision(props.stats.mean * 1000) + 'ms/op'
}

perfRunner.roundNumberWithPrecision = function(number, precision){
  if (!precision) precision = 1000;
  return Math.round(number * precision) / precision;
}

perfRunner.quickBench = function(benchmarkOptions, onComplete, onBeforeStart){
  var bench = new Benchmark(benchmarkOptions);
  if (onBeforeStart) onBeforeStart(null, bench);

  bench.on('error', function(event){
    console.error(event.message);
    console.log(event.target.compiled.toString());
    onComplete(Error(event.error));
  });

  bench.on('start', function(){
    console.log('starting', bench.name);
  });

  bench.on('cycle', function(){
    var bench = this,
        size = bench.stats.size;
  
    if (!bench.aborted) {
      console.warn(bench.name + ' × ' + bench.count +
        ' (' + bench.stats.sample.length + ' samples)' +
        ' (' + Math.round(1 / bench.stats.mean) + ' ops/sec' + ')' +
        ' (' + (bench.stats.mean * 1000) + ' ms/op' + ')' +
        ' (±' + bench.stats.rme.toFixed(2) + '%)' +
          ' with ' + React.version
      );
    }
  });

  bench.on('complete', function(){
    var results = {
      platform: Benchmark.platform.description,
      react: React.version,
      name: bench.name,
      // times: bench.times,
      // stats: bench.stats
    };
    
    results['s/op'] = bench.stats.mean
    results['ms/op'] = results['s/op'] * 1000
    results['op/s'] = 1 / results['s/op']
    results["% frame 60"] = results['ms/op'] / (1000 / 60) * 100
    
    console.log(results);
    onComplete(null, results);
  });

  bench.run();
};

perfRunner.singleTest = function(benchmarkOptions, onComplete){
  var bench = Benchmark(exports);
  bench.on('complete', function(){
    var results = {
      platform: Benchmark.platform.description,
      react: React.version,
      name: bench.name,
      stats: bench.stats
    };
    onComplete(results);
  });
  bench.run();
}

perfRunner.ViewObject = function(props){
  var value = props.value;
  delete props.value;
  
  if (typeof value != 'object') return React.DOM.span(props, [JSON.stringify(value), " ", typeof value]);
  
  return React.DOM.table(props, Object.keys(value).map(function(key){
    return React.DOM.tr(null,
      React.DOM.th(null, key),
      React.DOM.td(null, perfRunner.ViewObject({key:key, value:value[key]}))
    );
  }));
}
