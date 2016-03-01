'use strict';

var getComponentName = require('getComponentName');
var React = require('React');

describe('getComponentName', function() {
  it('should prefer `displayName`', function() {
    var displayName = 'Else';

    var Something = function Something() {};
    Something.displayName = displayName;

    expect(getComponentName(Something)).toBe(displayName);

    Something = React.createClass({
      render: function() {},
      displayName: displayName,
    });

    expect(getComponentName(Something)).toBe(displayName);
  });

  it('should fall back on `name`', function() {
    function Something() {}

    expect(getComponentName(Something)).toBe(Something.name);
  });
});
