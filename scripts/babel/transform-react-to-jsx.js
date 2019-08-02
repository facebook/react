'use strict';

const t = require('@babel/types');
const esutils = require('esutils');
const jsx = require('@babel/plugin-syntax-jsx');

function helper(opts) {
  console.log(jsx);
  const visitor = {};

  visitor.JSXSpreadChild = function(path) {
    throw path.buildCodeFrameError(
      'Spread children are not supported in React.'
    );
  };

  visitor.JSXElement = {
    exit(path, file) {
      const callExpr = buildElementCall(path, file);
      if (callExpr) {
        path.replaceWith(t.inherits(callExpr, path.node));
      }
    },
  };

  visitor.JSXFragment = {
    exit(path, file) {
      if (opts.compat) {
        throw path.buildCodeFrameError(
          'Fragment tags are only supported in React 16 and up.'
        );
      }
      const callExpr = buildFragmentCall(path, file);
      if (callExpr) {
        path.replaceWith(t.inherits(callExpr, path.node));
      }
    },
  };

  return visitor;

  function convertJSXIdentifier(node, parent) {
    if (t.isJSXIdentifier(node)) {
      if (node.name === 'this' && t.isReferenced(node, parent)) {
        return t.thisExpression();
      } else if (esutils.keyword.isIdentifierNameES6(node.name)) {
        node.type = 'Identifier';
      } else {
        return t.stringLiteral(node.name);
      }
    } else if (t.isJSXMemberExpression(node)) {
      return t.memberExpression(
        convertJSXIdentifier(node.object, node),
        convertJSXIdentifier(node.property, node)
      );
    }

    return node;
  }

  function convertAttributeValue(node) {
    if (t.isJSXExpressionContainer(node)) {
      return node.expression;
    } else {
      return node;
    }
  }

  function convertAttribute(node) {
    const value = convertAttributeValue(node.value || t.booleanLiteral(true));

    if (t.isStringLiteral(value) && !t.isJSXExpressionContainer(node.value)) {
      value.value = value.value.replace(/\n\s+/g, ' ');

      // "raw" JSXText should not be used from a StringLiteral because it needs to be escaped.
      if (value.extra && value.extra.raw) {
        delete value.extra.raw;
      }
    }

    if (t.isJSXNamespacedName(node.name)) {
      node.name = t.stringLiteral(
        node.name.namespace.name + ':' + node.name.name.name
      );
    } else if (esutils.keyword.isIdentifierNameES6(node.name.name)) {
      node.name.type = 'Identifier';
    } else {
      node.name = t.stringLiteral(node.name.name);
    }

    return t.inherits(t.objectProperty(node.name, value), node);
  }

  //   // <div {...props} key="Hi" /> should use React.createElement
  //   function isPropsSpreadFollowedByKey(node) {

  //   }

  function buildElementCall(path, file) {
    if (opts.filter && !opts.filter(path.node, file)) return;

    const openingPath = path.get('openingElement');
    openingPath.parent.children = t.react.buildChildren(openingPath.parent);

    const tagExpr = convertJSXIdentifier(
      openingPath.node.name,
      openingPath.node
    );
    const args = [];

    let tagName;
    if (t.isIdentifier(tagExpr)) {
      tagName = tagExpr.name;
    } else if (t.isLiteral(tagExpr)) {
      tagName = tagExpr.value;
    }

    const state = {
      tagExpr: tagExpr,
      tagName: tagName,
      args: args,
    };

    if (opts.pre) {
      opts.pre(state, file);
    }

    let attribs = openingPath.node.attributes;
    if (attribs.length) {
      attribs = buildOpeningElementAttributes(attribs, file);
    } else {
      attribs = t.nullLiteral();
    }

    args.push(attribs, ...path.node.children);

    if (opts.post) {
      opts.post(state, file);
    }

    return state.call || t.callExpression(state.callee, args);
  }

  function pushProps(_props, objs) {
    if (!_props.length) return _props;

    objs.push(t.objectExpression(_props));
    return [];
  }

  /**
   * The logic for this is quite terse. It's because we need to
   * support spread elements. We loop over all attributes,
   * breaking on spreads, we then push a new object containing
   * all prior attributes to an array for later processing.
   */

  function buildOpeningElementAttributes(attribs, file) {
    let _props = [];
    const objs = [];

    const useBuiltIns = file.opts.useBuiltIns || false;
    if (typeof useBuiltIns !== 'boolean') {
      throw new Error(
        'transform-react-jsx currently only accepts a boolean option for ' +
          'useBuiltIns (defaults to false)'
      );
    }

    while (attribs.length) {
      const prop = attribs.shift();
      if (t.isJSXSpreadAttribute(prop)) {
        _props = pushProps(_props, objs);
        objs.push(prop.argument);
      } else {
        _props.push(convertAttribute(prop));
      }
    }

    pushProps(_props, objs);

    if (objs.length === 1) {
      // only one object
      attribs = objs[0];
    } else {
      // looks like we have multiple objects
      if (!t.isObjectExpression(objs[0])) {
        objs.unshift(t.objectExpression([]));
      }

      const expressionHelper = useBuiltIns
        ? t.memberExpression(t.identifier('Object'), t.identifier('assign'))
        : file.addHelper('extends');

      // spread it
      attribs = t.callExpression(expressionHelper, objs);
    }

    return attribs;
  }

  function buildFragmentCall(path, file) {
    if (opts.filter && !opts.filter(path.node, file)) return;

    const openingPath = path.get('openingElement');
    openingPath.parent.children = t.react.buildChildren(openingPath.parent);

    const args = [];
    const tagName = null;
    const tagExpr = file.get('jsxFragIdentifier')();

    const state = {
      tagExpr: tagExpr,
      tagName: tagName,
      args: args,
    };

    if (opts.pre) {
      opts.pre(state, file);
    }

    // no attributes are allowed with <> syntax
    args.push(t.nullLiteral(), ...path.node.children);

    if (opts.post) {
      opts.post(state, file);
    }

    file.set('usedFragment', true);
    return state.call || t.callExpression(state.callee, args);
  }
}

module.exports = function(babel, options) {
  // const NEW_PRAGMA = options.development ? 'React.jsx' : 'React.jsxDEV';
  const NEW_PRAGMA = 'React.jsx';
  const OLD_PRAGMA = 'React.createElement';

  const createIdentifierParser = id => () => {
    return id
      .split('.')
      .map(name => t.identifier(name))
      .reduce((object, property) => t.memberExpression(object, property));
  };

  const visitor = helper({
    pre(state) {
      const tagName = state.tagName;
      const args = state.args;
      if (t.react.isCompatTag(tagName)) {
        args.push(t.stringLiteral(tagName));
      } else {
        args.push(state.tagExpr);
      }
    },

    post(state, pass) {
      state.callee = pass.get('jsxIdentifier')();
    },
  });

  visitor.JSXAttribute = function(path) {
    if (t.isJSXElement(path.node.value)) {
      path.node.value = t.v(path.node.value);
    }
  };

  return {
    name: 'transform-react-jsx',
    inherits: jsx,
    visitor,
  };
};
