var BenchmarkQueue = React.createClass({
  propTypes: {
    debug: React.PropTypes.bool,
    onChange: React.PropTypes.func.isRequired,
    initialQueue: React.PropTypes.array.isRequired,
    maxTime: React.PropTypes.number,
    onCompleteEach: React.PropTypes.func,
    onError: React.PropTypes.func
  },

  getDefaultProps: function(){
    return {
      maxTime: 5
    };
  },

  getInitialState: function(){
    return {
      queue: this.props.initialQueue.slice()
    };
  },

  setItemState: function(state){
    state.test = this.state.queue[0].test;
    state.react = this.state.queue[0].react;
    this.props.onChange(state);
  },

  handleContextReady: function(window){
    var benchmark = window.Benchmark(window.exports);
    benchmark.options.maxTime = this.props.maxTime; //DEBUG

    var itemState = {
      testRunnerURL: window.location.href,

      name: window.exports.name,
      platform: window.Benchmark.platform.description,
      reactVersion: window.React.version,

      isMinified: (function(){
        var code = window.React.render.toString();
        return code.indexOf(',') - code.indexOf('(') <= 2;
      }())
    };

    this.setItemState(itemState);

    var self = this;
    benchmark.on('start error cycle complete', function(){
      var stats = JSON.parse(JSON.stringify(benchmark.stats));
      itemState.stats = stats;
      itemState.isRunning = benchmark.running;
      itemState.error = benchmark.error;
      self.setItemState(itemState);
    });
    if (this.props.onError) {
      benchmark.on('error', this.props.onError);
    }
    benchmark.on('complete', function(){
      var queue = self.state.queue.slice();
      var queueItem = queue.shift();
      if (self.props.onCompleteEach) {
        self.props.onCompleteEach(queueItem);
      }
      self.setState({ queue:queue });
    });
    benchmark.run({async:true});
  },

  shouldComponentUpdate: function(nextProps, nextState){
    return nextState.queue.length < this.state.queue.length;
  },

  render: function(){
    if (!(this.state.queue && this.state.queue.length > 0)){
      return React.DOM.div({style:{display:'none'}});
    }
    return BrowserPerfRunnerContext({
      debug: this.props.debug,
      test: this.state.queue[0].test,
      react: this.state.queue[0].react,
      onReady: this.handleContextReady
    });
  }
});

var BrowserPerfRunnerContext = React.createClass({

  propTypes: {
    debug: React.PropTypes.bool,
    test: function(object, key){
      React.PropTypes.string.isRequired(object, key);
      if (/\.jsx?$/i.test(object[key])) return;
      throw Error('Expected `' + key + '` to be a test file name with extension `.js` or `.jsx`');
    },
    react: function(object, key){
      React.PropTypes.string.isRequired(object, key);
      if (/^(?:builds\/.+|edge|previous|(?:\d+\.){2}\d+)$/.test(object[key])) return;
      throw Error('Expected `' + key + '` prop to be a valid react version string, build string or "edge" or "previous"');
    },
    onReady: React.PropTypes.func.isRequired
  },

  getInitialState: function(){
    return {
      testRunnerURL:'about:blank'
    };
  },

  // _handleFrameError: function(error){
  //   console.error('BrowserPerfRunnerContext', error);
  // },
  //
  // _handleFrameLoad: function(event){
  //   console.log('BrowserPerfRunnerContext', event);
  // },
  //
  _handleMessage: function(event){
    if (location.href.indexOf(event.origin) !== 0)
      return console.debug('BrowserPerfRunnerContext#_handleMessage ignored message from ' + event.origin);
    if (event.source.location.href.indexOf(this.state.testRunnerURL) === -1)
      return console.debug('BrowserPerfRunnerContext#_handleMessage ignored message from ' + event.source.location.href);
    if (event.data !== 'Ready!')
      return console.debug('BrowserPerfRunnerContext#_handleMessage ignored message ' + JSON.stringify(event.data));

    this.props.onReady(event.source);
  },

  _getTestRunnerURL: function(props){
    return 'runner.html' +
      '?' +
      'debug=' + (props.debug ? 1 : 0) +
      '&' +
      'react=' + encodeURIComponent(props.react) +
      '&' +
      'test=' + encodeURIComponent(props.test)
  },

  _renderState: function(props){
    return {
      testRunnerURL: this._getTestRunnerURL(props)
    };
  },

  componentDidMount: function(){
    var node = this.refs.iframe.getDOMNode();
    // node.onload = this._handleFrameLoad;
    // node.onerror = this._handleFrameError;
    if (window.addEventListener) {
      window.addEventListener('message', this._handleMessage, false);
    } else if (window.attachEvent) {
      window.attachEvent('onmessage', this._handleMessage);
    } else {
      throw Error('cannot attach onmessage listener');
    }
    this.setState(this._renderState(this.props));
  },

  componentWillUnmount: function(){
    if (window.removeEventListener) {
      window.removeEventListener('message', this._handleMessage);
    } else if (window.detachEvent) {
      window.detachEvent('onmessage', this._handleMessage);
    } else {
      throw Error('cannot detach onmessage listener');
    }
    this.refs.iframe.getDOMNode().src = '';
  },

  componentWillReceiveProps: function(nextProps){
    this.setState(this._renderState(nextProps));
  },

  shouldComponentUpdate: function(nextProps, nextState){
    return nextState.testRunnerURL != this.state.testRunnerURL;
  },

  render: function(){
    return (
      React.DOM.iframe({
        ref: 'iframe',
        name: "BrowserPerfRunnerContextFrame",
        style: this.style,
        src: this.state.testRunnerURL
      })
    );
  },

  style: {
    position: 'absolute',
    right: '100%',
    bottom: '100%'
  }

});
