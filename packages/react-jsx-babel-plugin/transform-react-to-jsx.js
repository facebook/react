'use strict';

const t = require('@babel/types');
const esutils = require('esutils');
// const jsx = '@babel/plugin-syntax-jsx';

function helper(opts) {
  const visitor = {};

  visitor.JSXNamespacedName = function(path, state) {
    const throwIfNamespace =
      state.opts.throwIfNamespace === undefined
        ? true
        : !!state.opts.throwIfNamespace;
    if (throwIfNamespace) {
      throw path.buildCodeFrameError(
        `Namespace tags are not supported by default. React's JSX doesn't support namespace tags. \
You can turn on the 'throwIfNamespace' flag to bypass this warning.`,
      );
    }
  };

  visitor.JSXSpreadChild = function(path) {
    throw path.buildCodeFrameError(
      'Spread children are not supported in React.',
    );
  };

  visitor.JSXElement = {
    enter(path, state) {},
    exit(path, file) {
      let callExpr;
      if (file.opts.useCreateElement || useCreateElement(path)) {
        callExpr = buildElementCall(path, file);
      } else {
        callExpr = buildJSXElementCall(path, file);
      }

      if (callExpr) {
        path.replaceWith(t.inherits(callExpr, path.node));
      }
    },
  };

  visitor.JSXFragment = {
    exit(path, file) {
      if (opts.compat) {
        throw path.buildCodeFrameError(
          'Fragment tags are only supported in React 16 and up.',
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
        convertJSXIdentifier(node.property, node),
      );
    } else if (t.isJSXNamespacedName(node)) {
      /**
       * If there is flag "throwIfNamespace"
       * print XMLNamespace like string literal
       */
      return t.stringLiteral(`${node.namespace.name}:${node.name.name}`);
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
        node.name.namespace.name + ':' + node.name.name.name,
      );
    } else if (esutils.keyword.isIdentifierNameES6(node.name.name)) {
      node.name.type = 'Identifier';
    } else {
      node.name = t.stringLiteral(node.name.name);
    }

    return t.inherits(t.objectProperty(node.name, value), node);
  }

  function buildJSXElementCall(path, file) {
    if (opts.filter && !opts.filter(path.node, file)) return;

    const openingPath = path.get('openingElement');
    openingPath.parent.children = t.react.buildChildren(openingPath.parent);

    const tagExpr = convertJSXIdentifier(
      openingPath.node.name,
      openingPath.node,
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
    let keyValue;
    for (let i = 0, attrLength = attribs.length; i < attrLength; i++) {
      const attr = attribs[i];
      if (t.isJSXAttribute(attr)) {
        if (t.isJSXIdentifier(attr.name) && attr.name.name === 'key') {
          keyValue = attr.value;
        }
      }
    }

    if (attribs.length || path.node.children.length) {
      attribs = buildOpeningElementAttributes(
        attribs,
        file,
        true,
        path.node.children,
      );
    } else {
      attribs = t.nullLiteral();
    }

    args.push(attribs);

    if (keyValue !== undefined) {
      args.push(keyValue);
    }

    if (opts.post) {
      opts.post(state, file);
    }

    return state.call || t.callExpression(state.callee, args);
  }

  function buildElementCall(path, file) {
    if (opts.filter && !opts.filter(path.node, file)) return;

    const openingPath = path.get('openingElement');
    openingPath.parent.children = t.react.buildChildren(openingPath.parent);

    const tagExpr = convertJSXIdentifier(
      openingPath.node.name,
      openingPath.node,
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

    return state.call || t.callExpression(state.oldCallee, args);
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

  function buildOpeningElementAttributes(attribs, file, isReactJSX, children) {
    let _props = [];
    const objs = [];

    const useBuiltIns = file.opts.useBuiltIns || false;
    if (typeof useBuiltIns !== 'boolean') {
      throw new Error(
        'transform-react-jsx currently only accepts a boolean option for ' +
          'useBuiltIns (defaults to false)',
      );
    }

    while (attribs.length) {
      const prop = attribs.shift();
      if (t.isJSXSpreadAttribute(prop)) {
        _props = pushProps(_props, objs);
        objs.push(prop.argument);
      } else {
        const attr = convertAttribute(prop);
        // if we are using React.JSX, we don't want to pass 'key' as a prop
        // so don't add it to the list
        if (!isReactJSX || attr.key.name !== 'key') {
          _props.push(attr);
        }
      }
    }

    // if we are using React.JSX, children is now a prop, so add it to the list

    console.log(children);
    if (isReactJSX && children && children.length > 0) {
      if (children.length === 1) {
        _props.push(t.objectProperty(t.identifier('children'), children[0]));
      } else {
        _props.push(
          t.objectProperty(
            t.identifier('children'),
            t.arrayExpression(children),
          ),
        );
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
    // React.createElement uses different syntax than React.jsx
    // createElement passes in children as a separate argument,
    // whereas jsx passes children in as a prop
    if (file.opts.useCreateElement) {
      args.push(t.nullLiteral(), ...path.node.children);
    } else {
      args.push(
        t.objectExpression([
          t.objectProperty(
            t.identifier('children'),
            t.arrayExpression(path.node.children),
          ),
        ]),
      );
    }

    if (opts.post) {
      opts.post(state, file);
    }

    return (
      state.call ||
      t.callExpression(
        file.opts.useCreateElement ? state.oldCallee : state.callee,
        args,
      )
    );
  }

  function useCreateElement(path) {
    const openingPath = path.get('openingElement');
    const attributes = openingPath.node.attributes;

    let seenPropsSpread = false;
    for (let i = 0, length = attributes.length; i < length; i++) {
      const attr = attributes[i];
      if (
        seenPropsSpread &&
        t.isJSXAttribute(attr) &&
        attr.name.name === 'key'
      ) {
        return true;
      } else if (t.isJSXSpreadAttribute(attr)) {
        seenPropsSpread = true;
      }
    }
    return false;
  }
}

module.exports = function(babel) {
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
      state.oldCallee = pass.get('oldJSXIdentifier')();
    },
  });

  visitor.Program = {
    enter(path, state) {
      const pragma = state.opts.development ? 'React.jsxDEV' : 'React.jsx';
      const pragmaFrag = 'React.Fragment';
      state.set(
        'oldJSXIdentifier',
        createIdentifierParser('React.createElement'),
      );
      state.set('jsxIdentifier', createIdentifierParser(pragma));
      state.set('jsxFragIdentifier', createIdentifierParser(pragmaFrag));
    },
  };

  visitor.JSXAttribute = function(path) {
    if (t.isJSXElement(path.node.value)) {
      path.node.value = t.jsxExpressionContainer(path.node.value);
    }
  };

  return {
    name: 'transform-react-jsx',
    visitor,
  };
};
