/* jshint undef: true, unused: true */

/* global document */
/* global window */
/* global Benchmark */
/* global React */

if (typeof exports == 'undefined') exports = {};

/*http://benchmarkjs.com/docs#options*/

exports.name = 'React.render single div';

exports.setup = function(){
  /*global*/_rootNode = document.createElement('div');
  document.body.appendChild(_rootNode);
};
exports.fn = function(){
  React.render(React.DOM.div(null, 'lol, perf testing ', this.count), _rootNode);
};
exports.teardown = function(){
  if (React.unmountAndReleaseReactRootNode) React.unmountAndReleaseReactRootNode(_rootNode);
  else React.unmountComponentAtNode(_rootNode);
};
