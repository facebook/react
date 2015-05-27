/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/*eslint-disable comma-dangle*/

'use strict';

function updateReactCreateClassToES6(file, api, options) {
  const j = api.jscodeshift;

  require('./utils/array-polyfills');
  const ReactUtils = require('./utils/ReactUtils')(j);

  const printOptions = options.printOptions || {quote: 'single'};
  const root = j(file.source);

  const AUTOBIND_IGNORE_KEYS = {
    componentDidMount: true,
    componentDidUpdate: true,
    componentWillReceiveProps: true,
    componentWillMount: true,
    componentWillUpdate: true,
    componentWillUnmount: true,
    getDefaultProps: true,
    getInitialState: true,
    render: true,
    shouldComponentUpdate: true,
  };

  const BASE_COMPONENT_METHODS = ['setState', 'forceUpdate'];

  const DEFAULT_PROPS_FIELD = 'getDefaultProps';
  const DEFAULT_PROPS_KEY = 'defaultProps';
  const GET_INITIAL_STATE_FIELD = 'getInitialState';

  const DEPRECATED_APIS = [
    'getDOMNode',
    'isMounted',
    'replaceProps',
    'replaceState',
    'setProps',
  ];

  const STATIC_KEYS = {
    childContextTypes: true,
    contextTypes: true,
    displayName: true,
    propTypes: true,
  };

  // ---------------------------------------------------------------------------
  // Checks if the module uses mixins or accesses deprecated APIs.
  const checkDeprecatedAPICalls = classPath =>
    DEPRECATED_APIS.reduce(
      (acc, name) =>
        acc + j(classPath)
          .find(j.Identifier, {name})
          .size(),
      0
    ) > 0;

  const callsDeprecatedAPIs = classPath => {
    if (checkDeprecatedAPICalls(classPath)) {
      console.log(
        file.path + ': "' + ReactUtils.getComponentName(classPath) + '" ' +
        'skipped because of deprecated API calls. Remove calls to ' +
        DEPRECATED_APIS.join(', ') + ' in your React component and re-run ' +
        'this script.'
      );
      return false;
    }
    return true;
  };

  const hasMixins = classPath => {
    if (ReactUtils.hasMixins(classPath)) {
      console.log(
        file.path + ': "' + ReactUtils.getComponentName(classPath) + '" ' +
        ' skipped because of mixins.'
      );
      return false;
    }
    return true;
  };

  // ---------------------------------------------------------------------------
  // Helpers
  const createFindPropFn = prop => property => (
    property.key &&
    property.key.type === 'Identifier' &&
    property.key.name === prop
  );

  const filterDefaultPropsField = node =>
    createFindPropFn(DEFAULT_PROPS_FIELD)(node);

  const filterGetInitialStateField = node =>
    createFindPropFn(GET_INITIAL_STATE_FIELD)(node);

  const findGetDefaultProps = specPath =>
    specPath.properties.find(createFindPropFn(DEFAULT_PROPS_FIELD));

  const findGetInitialState = specPath =>
    specPath.properties.find(createFindPropFn(GET_INITIAL_STATE_FIELD));

  // This is conservative; only check for `setState` and `forceUpdate` literals
  // instead of also checking which objects they are called on.
  const shouldExtendReactComponent = classPath =>
    BASE_COMPONENT_METHODS.some(name => (
      j(classPath)
        .find(j.Identifier, {name})
        .size() > 0
    ));

  const withComments = (to, from) => {
    to.comments = from.comments;
    return to;
  };

  // ---------------------------------------------------------------------------
  // Collectors
  const isFunctionExpression = node => (
    node.key &&
    node.key.type === 'Identifier' &&
    node.value &&
    node.value.type === 'FunctionExpression'
  );

  const collectStatics = specPath => {
    const statics = specPath.properties.find(createFindPropFn('statics'));
    const staticsObject =
      (statics && statics.value && statics.value.properties) || [];

    const getDefaultProps = findGetDefaultProps(specPath);
    if (getDefaultProps) {
      staticsObject.push(createDefaultProps(getDefaultProps));
    }

    return (
      staticsObject.concat(specPath.properties.filter(property =>
        property.key && STATIC_KEYS[property.key.name]
      ))
      .sort((a, b) => a.key.name < b.key.name)
    );
  };

  const collectFunctions = specPath => specPath.properties
    .filter(prop =>
      !(filterDefaultPropsField(prop) || filterGetInitialStateField(prop))
    )
    .filter(isFunctionExpression);

  const findAutobindNamesFor = (subtree, fnNames, literalOrIdentifier) => {
    const node = literalOrIdentifier;
    const autobindNames = {};

    j(subtree)
      .find(j.MemberExpression, {
        object: node.name ? {
          type: node.type,
          name: node.name,
        } : {type: node.type},
        property: {
          type: 'Identifier',
        },
      })
      .filter(path => path.value.property && fnNames[path.value.property.name])
      .filter(path => {
        const call = path.parent.value;
        return !(
          call &&
          call.type === 'CallExpression' &&
          call.callee.type === 'MemberExpression' &&
          call.callee.object.type === node.type &&
          call.callee.object.name === node.name &&
          call.callee.property.type === 'Identifier' &&
          call.callee.property.name === path.value.property.name
        );
      })
      .forEach(path => autobindNames[path.value.property.name] = true);

    return Object.keys(autobindNames);
  };

  const collectAutoBindFunctions = (functions, classPath) => {
    const fnNames = {};
    functions
      .filter(fn => !AUTOBIND_IGNORE_KEYS[fn.key.name])
      .forEach(fn => fnNames[fn.key.name] = true);

    const autobindNames = {};
    const add = name => autobindNames[name] = true;

    // Find `this.<foo>`
    findAutobindNamesFor(classPath, fnNames, j.thisExpression()).forEach(add);

    // Find `self.<foo>` if `self = this`
    j(classPath)
      .findVariableDeclarators()
      .filter(path => (
        path.value.id.type === 'Identifier' &&
        path.value.init &&
        path.value.init.type === 'ThisExpression'
      ))
      .forEach(path =>
        findAutobindNamesFor(
          j(path).closest(j.FunctionExpression).get(),
          fnNames,
          path.value.id
        ).forEach(add)
      );

    return Object.keys(autobindNames).sort();
  };

  // ---------------------------------------------------------------------------
  // Boom!
  const createMethodDefinition = fn =>
    withComments(j.methodDefinition(
      '',
      fn.key,
      fn.value
    ), fn);

  const createBindAssignment = name =>
    j.expressionStatement(
      j.assignmentExpression(
        '=',
        j.memberExpression(
          j.thisExpression(),
          j.identifier(name),
          false
        ),
        j.callExpression(
          j.memberExpression(
            j.memberExpression(
              j.thisExpression(),
              j.identifier(name),
              false
            ),
            j.identifier('bind'),
            false
          ),
          [j.thisExpression()]
        )
      )
    );

  const createSuperCall = shouldAddSuperCall =>
    !shouldAddSuperCall ?
      [] :
      [j.expressionStatement(
        j.callExpression(
          j.identifier('super'),
          [j.identifier('props'), j.identifier('context')]
        )
      )];

  const updatePropsAccess = getInitialState =>
    getInitialState ?
      j(getInitialState)
        .find(j.MemberExpression, {
          object: {
            type: 'ThisExpression',
          },
          property: {
            type: 'Identifier',
            name: 'props',
          },
        })
        .forEach(path => j(path).replaceWith(j.identifier('props')))
        .size() > 0 :
      false;

  const inlineGetInitialState = getInitialState => {
    if (!getInitialState) {
      return [];
    }

    return getInitialState.value.body.body.map(statement => {
      if (statement.type === 'ReturnStatement') {
        return j.expressionStatement(
          j.assignmentExpression(
            '=',
            j.memberExpression(
              j.thisExpression(),
              j.identifier('state'),
              false
            ),
            statement.argument
          )
        );
      }

      return statement;
    });
  };

  const createConstructorArgs = (shouldAddSuperClass, hasPropsAccess) => {
    if (shouldAddSuperClass) {
      return [j.identifier('props'), j.identifier('context')];
    } else if (hasPropsAccess) {
      return [j.identifier('props')];
    } else {
      return [];
    }
  };

  const createConstructor = (
    getInitialState,
    autobindFunctions,
    shouldAddSuperClass
  ) => {
    if (!getInitialState && !autobindFunctions.length) {
      return [];
    }

    const hasPropsAccess = updatePropsAccess(getInitialState);
    return [createMethodDefinition({
      key: j.identifier('constructor'),
      value: j.functionExpression(
        null,
        createConstructorArgs(shouldAddSuperClass, hasPropsAccess),
        j.blockStatement(
          [].concat(
            createSuperCall(shouldAddSuperClass),
            autobindFunctions.map(createBindAssignment),
            inlineGetInitialState(getInitialState)
          )
        )
      ),
    })];
  };

  const createES6Class = (
    name,
    functions,
    getInitialState,
    autobindFunctions,
    comments,
    shouldAddSuperClass
  ) =>
    withComments(j.classDeclaration(
      name ? j.identifier(name) : null,
      j.classBody(
        [].concat(
          createConstructor(
            getInitialState,
            autobindFunctions,
            shouldAddSuperClass
          ),
          functions.map(createMethodDefinition)
        )
      ),
      shouldAddSuperClass ? j.memberExpression(
        j.identifier('React'),
        j.identifier('Component'),
        false
      ) : null
    ), {comments});

  const createStaticAssignment = (name, staticProperty) =>
    withComments(j.expressionStatement(
      j.assignmentExpression(
        '=',
        j.memberExpression(
          name,
          j.identifier(staticProperty.key.name),
          false
        ),
        staticProperty.value
      )
    ), staticProperty);

  const createStaticAssignmentExpressions = (name, statics) =>
    statics.map(staticProperty => createStaticAssignment(name, staticProperty));

  const hasSingleReturnStatement = value => (
    value.type === 'FunctionExpression' &&
    value.body &&
    value.body.type === 'BlockStatement' &&
    value.body.body &&
    value.body.body.length === 1 &&
    value.body.body[0].type === 'ReturnStatement' &&
    value.body.body[0].argument &&
    value.body.body[0].argument.type === 'ObjectExpression'
  );

  const createDefaultPropsValue = value => {
    if (hasSingleReturnStatement(value)) {
      return value.body.body[0].argument;
    } else {
      return j.callExpression(
        value,
        []
      );
    }
  };

  const createDefaultProps = prop =>
    withComments(
      j.property(
        'init',
        j.identifier(DEFAULT_PROPS_KEY),
        createDefaultPropsValue(prop.value)
      ),
      prop
    );

  const getComments = classPath => {
    if (classPath.value.comments) {
      return classPath.value.comments;
    }
    const declaration = j(classPath).closest(j.VariableDeclaration);
    if (declaration.size()) {
      return declaration.get().value.comments;
    }
    return null;
  };

  const createModuleExportsMemberExpression = () =>
    j.memberExpression(
      j.identifier('module'),
      j.identifier('exports'),
      false
    );

  const updateToES6Class = (classPath, shouldExtend, isModuleExports) => {
    const specPath = ReactUtils.getReactCreateClassSpec(classPath);
    const name = ReactUtils.getComponentName(classPath);
    const statics = collectStatics(specPath);
    const functions = collectFunctions(specPath);
    const comments = getComments(classPath);

    const autobindFunctions = collectAutoBindFunctions(functions, classPath);
    const getInitialState = findGetInitialState(specPath);

    const staticName =
      name ? j.identifier(name) : createModuleExportsMemberExpression();

    var path;
    if (isModuleExports) {
      path = ReactUtils.findReactCreateClassCallExpression(classPath);
    } else {
      path = j(classPath).closest(j.VariableDeclaration);
    }

    path.replaceWith(
      createES6Class(
        name,
        functions,
        getInitialState,
        autobindFunctions,
        comments,
        shouldExtend || shouldExtendReactComponent(classPath)
      )
    );

    const staticAssignments =
      createStaticAssignmentExpressions(staticName, statics);
    if (isModuleExports) {
      const body = root.get().value.body;
      body.push.apply(body, staticAssignments);
    } else {
      staticAssignments
        .forEach(expression => path = path.insertAfter(expression));
    }
  };

  if (
    options['no-explicit-require'] || ReactUtils.hasReact(root)
  ) {
    const apply = (path, isModuleExports) =>
      path
        .filter(hasMixins)
        .filter(callsDeprecatedAPIs)
        .forEach(classPath => updateToES6Class(
          classPath,
          !options['no-super-class'],
          isModuleExports
        ));

    const didTransform = (
      apply(ReactUtils.findReactCreateClass(root), false).size() +
      apply(ReactUtils.findReactCreateClassModuleExports(root), true).size()
    ) > 0;

    if (didTransform) {
      return root.toSource(printOptions) + '\n';
    }
  }

  return null;
}

module.exports = updateReactCreateClassToES6;
