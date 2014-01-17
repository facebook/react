if (typeof exports == 'undefined') exports = {};

/*http://benchmarkjs.com/docs#options*/

exports.name = 'propTypes';

var Thing = function() {};
var List;
var ListItem;
var MyReactComponent;
var _rootNode;

exports.setup = function(){
  List = React.createClass({
    propTypes: {
      array: React.PropTypes.array,
      bool: React.PropTypes.bool.isRequired,
      number: React.PropTypes.number,
      string: React.PropTypes.string.isRequired,
      func: React.PropTypes.func.isRequired,
      renderable: React.PropTypes.renderable.isRequired,
      instanceOf: React.PropTypes.instanceOf(Thing).isRequired
    },
    render: function() {
      return React.DOM.ul(null, this.props.children);
    }
  });

  ListItem = React.createClass({
    propTypes: {
      array: React.PropTypes.array,
      bool: React.PropTypes.bool.isRequired,
      number: React.PropTypes.number,
      string: React.PropTypes.string.isRequired,
      func: React.PropTypes.func.isRequired,
      renderable: React.PropTypes.renderable.isRequired,
      renderable2: React.PropTypes.renderable.isRequired,
      instanceOf: React.PropTypes.instanceOf(Thing).isRequired,
      component: React.PropTypes.component.isRequired
    },
    render: function(){
      return React.DOM.li(null,
        this.props.number + this.props.string + this.props.renderable
      );
    }
  });

  MyReactComponent = React.createClass({
    render: function() {
      return React.DOM.span();
    }
  });

  _rootNode = document.createElement('div');
  document.body.appendChild(_rootNode);
};
exports.fn = function(){
  var items = [];
  for (var i = 0; i < 1000; i++) {
    items.push(ListItem({
      array: [11, 12, 13, 14, 15, 16, 17, 18, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      bool: false,
      number: Math.random(),
      string: 'banana banana banana',
      func: function() { return 'this is a function'; },
      renderable: 'renderable string',
      renderable2: [MyReactComponent(), 'a string'],
      instanceOf: new Thing,
      component: MyReactComponent()
    }));
  };

  React.renderComponent(List({
    array: [11, 12, 13, 14, 15, 16, 17, 18, 19, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    bool: false,
    number: Math.random(),
    string: 'banana banana banana',
    func: function() { return 'this is a function'; },
    renderable: 'renderable string',
    instanceOf: new Thing
  }, items), _rootNode);
};
exports.teardown = function(){
  React.unmountComponentAtNode(_rootNode);
};
