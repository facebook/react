if (typeof exports === 'undefined') {
  exports = {};
}

/*http://benchmarkjs.com/docs#options*/

exports.name = 'unmountComponentAtNode';

exports.setup = function() {
  _rootNode = document.createElement('div');
  document.body.appendChild(_rootNode);
  var _firstChild = React.DOM.div(null, 'lol, perf testing ', this.count);
  React.render(_firstChild, _rootNode);
};
exports.fn = function() {
  if (React.unmountAndReleaseReactRootNode) {
    React.unmountAndReleaseReactRootNode(_rootNode);
  } else {
    React.unmountComponentAtNode(_rootNode);
  }
};
