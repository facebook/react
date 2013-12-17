var BrowserPerfRunnerApp = React.createClass({

  propTypes: {
    tests: React.PropTypes.array.isRequired,
    react: React.PropTypes.array.isRequired,
    maxTime: React.PropTypes.number,
    onCompleteEach: React.PropTypes.func,
    onComplete: React.PropTypes.func,
    onError: React.PropTypes.func,
    headless: React.PropTypes.bool
  },

  getInitialState: function(){
    var queue = [];
    this.props.tests.forEach(function(testName){
      this.props.react.forEach(function(version){
        queue.push({
          test: testName,
          react: version
        });
      },this);
    },this);
    return {
      queue: queue,
      results: {}
    };
  },

  handleResults: function(results){
    this.state.results[results.test + '@' + results.react] = results;
    this.replaceState(this.state);
  },

  handleComplete: function(queueItem){
    queueItem.completed = true;
    
    if (!this.props.onCompleteEach) {
      return;
    }
    // Can't get the resultsForAllVersions if there are still some queued
    var incompleteCount = 0;
    for (var index = this.state.queue.length; --index >= 0;){
      if (this.state.queue[index].completed) {
        continue;
      }
      if (this.state.queue[index].test === queueItem.test) {
        return;
      }
      incompleteCount ++;
    }
    var resultsForAllVersions = Object.keys(this.state.results)
      .filter(function(key){return key.indexOf(queueItem.test) === 0;})
      .map(function(key){return this.state.results[key];}, this)
    ;
    this.props.onCompleteEach(resultsForAllVersions);
    
    if (this.props.onComplete && incompleteCount === 0) {
      this.props.onComplete(this.state.results);
    }
  },

  render: function(){
    var grid = null;

    if (!this.props.headless) {
      grid = GridViewTable({
        rows: this.props.tests,
        cols: this.props.react,
        renderCell: BrowserPerfRunnerApp.renderBenchmarkCell,
        value: this.state.results
      });
    }

    return React.DOM.div(null,
      BenchmarkQueue({
        initialQueue: this.state.queue,
        onChange: this.handleResults,
        maxTime: this.props.maxTime,
        onCompleteEach: this.handleComplete,
        onError: this.props.onError
      }),
      grid
    );
  }
});

BrowserPerfRunnerApp.renderBenchmarkCell = function(props, row, col){
  if (col == null && row == null) return React.DOM.th(null);
  if (row == null) return React.DOM.th({style:{verticalAlign:'top', textAlign:'center'}}, col);

  var benchmarks = Object.keys(props.value)
    .filter(function(key){
      return key.indexOf(row) === 0;
    })
    .map(function(key){
      return props.value[key];
    })
    .filter(function(benchmark){
      return benchmark && !benchmark.isRunning && benchmark.stats;
    })
  ;
  
  if (col == null) return React.DOM.th({style:{verticalAlign:'top', textAlign:'right'}},
    React.DOM.a({href:'?test=' + row}, benchmarks[0] && benchmarks[0].name || row)
  );

  var key = row + '@' + col;
  var benchmark = props.value[key];
  if (!(benchmark && benchmark.stats)) return React.DOM.td({key:key});
 
 
  var colors = [
    '000000',
    'AA0000',
    '00AA00',
    'AA5500',
    '0000AA',
    'AA00AA',
    '00AAAA',
    'AAAAAA',

    '555555',
    'FF5555',
    '55FF55',
    'FFFF55',
    '5555FF',
    'FF55FF',
    '55FFFF',
    'FFFFFF'
  ];

  function chartValue(value){
    return Math.round(valueFromRangeToRange(value, chartValue.min, chartValue.max, 0, 100));
  }
  chartValue.min = Math.min.apply(Math, benchmarks.map(function(benchmark){return Math.min.apply(Math, benchmark.stats.sample);}));
  chartValue.max = Math.max.apply(Math, benchmarks.map(function(benchmark){return Math.max.apply(Math, benchmark.stats.sample);}));

  var means = benchmarks.map(function(benchmark){
    return benchmark.stats.mean;
  });
  benchmarks.forEach(function(benchmark){
    benchmark.isTheWinner = benchmark.stats.mean <= Math.min.apply(Math, means);
  });

  var chartValues = benchmarks.map(function(benchmark){
    // benchmark.stats.sample.sort(function(a,b){return b - a;});
    return benchmark.stats.sample.map(chartValue).join(',');
  }).join('|');

  return (
    React.DOM.td({key:key, style:{textAlign:'center', width:234, verticalAlign:'top'}},
      benchmark.error && benchmark.error.message || '',
      React.DOM.div({style: benchmark.isTheWinner ? { backgroundColor:'#0A5', color:'#AFA' } : {backgroundColor:'transparent', color:'inherit'}},
        Math.round(1 / benchmark.stats.mean * 100) / 100, " op/s ",
        React.DOM.strong(null, Math.round(benchmark.stats.mean * 1000 * 100) / 100, " ms/op "),
        React.DOM.small(null, "(±" + (Math.round(benchmark.stats.rme * 10) / 10) + "%)")
      ),
      benchmark.isRunning && 'Running' || React.DOM.img({
        style: {
          borderWidth: 2,
          borderStyle: 'solid',
          color: '#' + colors[benchmarks.indexOf(benchmark)]
        },
        width: 230,
        height: 50,
        src: 'https://chart.googleapis.com/chart?cht=ls&chs=460x100&chd=t:' + chartValues + '&chco=' + colors.join(',')
      })
    )
  );
}

function valueFromRangeToRange(value, fromMin, fromMax, toMin, toMax){
  var fromRange = fromMax - fromMin;
  var toRange = toMax - toMin;
  return (((value - fromMin) * toRange) / fromRange) + toMin;
}

var GridViewTable = React.createClass({

  propTypes: {
    rows: React.PropTypes.array.isRequired,
    cols: React.PropTypes.array.isRequired,
    renderCell: React.PropTypes.func.isRequired
  },

  _renderCell: function(col){
    return this.props.renderCell({ value:this.props.value }, this._row, col);
  },

  _renderRow: function(row){
    this._row = row;
    return React.DOM.tr({key:row},
      this._renderCell(null, 0),
      this.props.cols.map(this._renderCell, this)
    );
  },

  render: function(){
    return React.DOM.table(null,
      this._renderRow(null, 0),
      this.props.rows.map(this._renderRow, this)
    );
  }

});
