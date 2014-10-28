if (typeof exports == 'undefined') exports = {};

/*http://benchmarkjs.com/docs#options*/

exports.name = 'shouldComponentUpdate';

exports.setup = function(){
  var AwesomeComponent = React.createClass({
    shouldComponentUpdate: function(){
      return false;
    },
    render: function(){
      return React.DOM.div({});
    }
  });

  var _rootNode = document.createElement('div');
  document.body.appendChild(_rootNode);
};
exports.fn = function(){
  React.render(AwesomeComponent(null), _rootNode);
};
exports.teardown = function(){
  React.unmountComponentAtNode(_rootNode);
};
