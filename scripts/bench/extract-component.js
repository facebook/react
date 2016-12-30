/*global copy */
/*eslint-disable no-debugger */

// Copy and paste this file into your (Chrome) browser console after changing
// the React root ID. Works on facebook.com as of 7/6/16 (use a test user).
// Then run this to convert the JSX:
//
//   ../../node_modules/.bin/babel \
//     --presets ../../node_modules/babel-preset-react \
//     --no-babelrc --compact=false \
//     bench-foo.js -o bench-foo-es5.js

'use strict';

var rootID = 5;
var outputStatelessFunctional = false;

var React = require('React');
var ReactMount = require('ReactMount');
copy(print(ReactMount._instancesByReactRootID[rootID]._renderedComponent));

function elementMeta(element) {
  var meta = '';
  var key = element.key;
  if (key) {
    meta += ' key={' + JSON.stringify(key) + '}';
  }
  var ref = element.ref;
  if (typeof ref === 'string') {
    meta += ' ref={' + JSON.stringify(ref) + '}';
  } else if (typeof ref === 'function') {
    meta += ' ref={function() {}}';
  }
  return meta;
}

function print(outerComponent) {
  var typeCounter = 0;
  var elementCounter = 0;
  var composites = new Map();

  function addComposite(type, child) {
    var info = composites.get(type);
    if (!info) {
      var name = (type.displayName || type.name || 'Component').replace(/(?:^[^a-z]|\W)+/gi, '_') + typeCounter++;
      if (!/^[A-Z]/.test(name)) {
        name = '_' + name;
      }
      info = {name: name, values: new Map()};
      composites.set(type, info);
    }
    var c = elementCounter++;
    info.values.set(c, child);
    return '<' + info.name + ' x={' + c + '} />';
  }

  function printComposite(info) {
    if (outputStatelessFunctional) {
      output += 'var ' + info.name + ' = function(props) {\n';
    } else {
      output += 'var ' + info.name + ' = React.createClass({\n';
      output += '  render: function() {\n';
      output += '    var props = this.props;\n';
    }
    for (var [c, child] of info.values) {
      output += '    if (props.x === ' + c + ') {\n';
      if (child.indexOf('\n') !== -1) {
        output += '      return (\n';
        output += child.replace(/^|\n/g, '$&        ') + '\n';
        output += '      );\n';
      } else {
        output += '      return ' + child + ';\n';
      }
      output += '    }\n';
    }
    if (outputStatelessFunctional) {
      output += '};\n';
    } else {
      output += '  },\n';
      output += '});\n';
    }
    output += '\n';
  }

  function printImpl(component) {
    var element = component._currentElement;

    // Empty component
    if (element === null || element === false) {
      return '' + element;
    }

    // Text component
    if (typeof element === 'string' || typeof element === 'number') {
      return JSON.stringify(element);
    }

    // Composite component
    if (typeof element.type === 'function') {
      var rendered = printImpl(component._renderedComponent);
      return addComposite(component._currentElement.type, rendered)
        .replace(/(?= \/>$)/, elementMeta(component._currentElement));
    }

    // Native component
    if (typeof element.type === 'string') {
      var markup = '<' + element.type;
      markup += elementMeta(component._currentElement);
      for (var propKey in element.props) {
        var value = element.props[propKey];
        var valueString = null;
        if (propKey === 'style' || propKey === 'dangerouslySetInnerHTML') {
          valueString = JSON.stringify(value);
        } else if (propKey === 'children') {
        } else {
          if (typeof value === 'function') {
            valueString = 'function() {}';
          } else if (typeof value === 'string' || typeof value === 'number') {
            valueString = JSON.stringify(value);
          } else if (value == null || typeof value === 'boolean') {
            valueString = '' + value;
          } else if (typeof value === 'object') {
            valueString = '{}';
            console.log('smooshing', element.type, propKey, value);
          } else {
            debugger;
            throw new Error('huh? ' + typeof value + ' ' + value);
          }
        }
        if (valueString) {
          markup += ' ' + propKey + '={' + valueString + '}';
        }
      }
      markup += '>';

      if (
        typeof element.props.children === 'string' ||
        typeof element.props.children === 'number'
      ) {
        markup += '{' + JSON.stringify(element.props.children) + '}';
      } else if (component._renderedChildren) {
        var renderedChildren = component._renderedChildren;
        var keys = Object.keys(renderedChildren);
        var values = keys.map((childKey) => renderedChildren[childKey]);

        if (keys.length) {
          var dump = function(children) {
            if (typeof children === 'boolean' || children == null) {
              return '' + children;
            }
            if (typeof children === 'object' && !Array.isArray(children) && children[Symbol.iterator]) {
              // TODO: Not quite right.
              children = Array.from(children);
            }
            if (Array.isArray(children)) {
              return children.length ? (
                '[\n' +
                children.map(function(ch) {
                  return '  ' + dump(ch).replace(/\n/g, '$&  ') + ',\n';
                }).join('') +
                ']'
              ) : '[]';
            } else if (React.isValidElement(children) || typeof children === 'string' || typeof children === 'number') {
              return printImpl(values.shift());
            } else {
              debugger;
              throw new Error('hmm');
            }
          };

          markup += '\n';
          var children = element.props.children;
          children = Array.isArray(children) ? children : [children];
          children.forEach(function(child) {
            var dumped = dump(child).replace(/\n/g, '$&  ');
            if (dumped.charAt(0) === '<') {
              markup += '  ' + dumped + '\n';
            } else {
              markup += '  {' + dumped + '}\n';
            }
          });
          if (values.length !== 0) {
            debugger;
            throw new Error('not all children processed');
          }
        }
      }

      markup += '</' + element.type + '>';
      return markup;
    }

    debugger;
    throw new Error('hmm');
  }

  var output = '(function() {\n\n';

  var tail = printImpl(outerComponent);
  for (var info of composites.values()) {
    printComposite(info);
  }
  printComposite({name: 'Benchmark', values: new Map([[undefined, tail]])});
  output += 'this.Benchmark = Benchmark;\n';
  output += '\n})(this);\n';
  return output;
}
