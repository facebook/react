var TESTS = {
  changeTextContent: function() {
    var mountNode = document.getElementById('mountNode');
    // --
    for (var ii = 0; ii < 10 * 100; ii++) {
      React.renderComponent(React.DOM.div({}, ii), mountNode);
    }
    // --
    React.unmountComponentAtNode(mountNode);
  },

  changeClassName: function() {
    var mountNode = document.getElementById('mountNode');
    // --
    for (var ii = 0; ii < 10 * 300; ii++) {
      React.renderComponent(React.DOM.div({className: ii}), mountNode);
    }
    // --
    React.unmountComponentAtNode(mountNode);
  },

  // This test renders a very deep element
  deepElement: function() {
    var mountNode = document.getElementById('mountNode');
    // --
    var div = React.DOM.div({});
    for (var ii = 0; ii < 100; ii++) {
      div = React.DOM.div({}, div);
    }

    for (var i = 0; i < 30; i++) {
      React.renderComponent(div, mountNode);
    }

    // --
    React.unmountComponentAtNode(mountNode);
  },

  // This test exercises hiding and displaying a node
  toggleElement: function() {
    var mountNode = document.getElementById('mountNode');
    // --
    for (var i = 0; i < 1000; i++) {
      React.renderComponent(React.DOM.div({}, React.DOM.div({})), mountNode);
      React.renderComponent(React.DOM.div({}, null), mountNode);
    }

    // --
    React.unmountComponentAtNode(mountNode);
  },

  // This test exercises scrolling through a list of elements in a table.
  // At every step, the first row is deleted and a new row is added at the end.
  rollingTable: function() {
    var mountNode = document.getElementById('mountNode');
    // --
    for (var ii = 0; ii < 150; ii++) {
      var rows = {};
      for (var jj = 0; jj < 20; jj++) {
        rows[ii + jj] =
          React.DOM.tr({key: ii + ',' + jj},
                       [React.DOM.td({}, ii), React.DOM.td({}, jj)]
                      );
      }
      var table = React.DOM.table({},
                                  React.DOM.tbody({},
                                                  rows
                                                 )
                                 );

      React.renderComponent(table, mountNode);
    }
    // --
    React.unmountComponentAtNode(mountNode);
  },

  numbersTable: function() {
    var mountNode = document.getElementById('mountNode');
    var N = 50;

    var data = [];
    for (var ii = 0; ii < N; ii++) {
      data[ii] = [];
      for (var jj = 0; jj < N; jj++) {
        data[ii][jj] = ii * N + jj;
      }
    }
    var Cell = React.createClass({
      render: function() {
        return React.DOM.td({}, this.props.value);
      }
    });
    var Row = React.createClass({
      render: function() {
        var cells = [];
        for (var jj = 0; jj < this.props.data.length; jj++) {
          cells.push(Cell({value: this.props.data[jj]}));
        }
        return React.DOM.tr({}, cells);
      }
    });
    var Table = React.createClass({
      render: function() {
        var rows = [];
        for (var jj = 0; jj < this.props.data.length; jj++) {
          rows.push(Row({data: this.props.data[jj]}));
        }
        return React.DOM.table({}, rows);
      }
    });

    // --
    React.renderComponent(Table({data: data}), mountNode);
    // --
    React.unmountComponentAtNode(mountNode);
  },

  bigFlatListReconcile: function() {
    var mountNode = document.getElementById('mountNode');

    var Child = React.createClass({
      render: function() {
        // Add some extra props to dirty check
        return React.DOM.div({style: {border: '1px solid red', fontFamily: 'sans-serif'}}, this.props.children);
      }
    });

    var Parent = React.createClass({
      render: function() {
        var children = [];
        for (var i = 0; i < 2000; i++) {
          children.push(Child({key: 'child' + i}, 'child ' + i));
        }
        return React.DOM.div(null, children);
      }
    });
    // --
    for (var ii = 0; ii < 5; ii++) {
      React.renderComponent(Parent(), mountNode);
    }
    // --
    React.unmountComponentAtNode(mountNode);
  },

  bigFlatListShouldUpdate: function() {
    var mountNode = document.getElementById('mountNode');

    var Child = React.createClass({
      shouldComponentUpdate: function(nextProps) {
        return this.props.children !== nextProps.children;
      },

      render: function() {
        // Add some extra props to dirty check
        return React.DOM.div({style: {border: '1px solid red', fontFamily: 'sans-serif'}}, this.props.children);
      }
    });

    var Parent = React.createClass({
      render: function() {
        var children = [];
        for (var i = 0; i < 2000; i++) {
          children.push(Child({key: 'child' + i}, 'child ' + i));
        }
        return React.DOM.div(null, children);
      }
    });
    // --
    for (var ii = 0; ii < 5; ii++) {
      React.renderComponent(Parent(), mountNode);
    }
    // --
    React.unmountComponentAtNode(mountNode);
  }
};