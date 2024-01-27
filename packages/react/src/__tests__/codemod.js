// jscodeshift can take a parser, like "babel", "babylon", "flow", "ts", or "tsx"
// Read more: https://github.com/facebook/jscodeshift#parser
export const parser = 'flow';

// Press ctrl+space for code completion
export default function transformer(file, api) {
  const j = api.jscodeshift;

  return j(file.source)
    .find(j.ExpressionStatement)
    .forEach(path => {
      const {
        node: {
          expression: {callee},
        },
      } = path;

      if (
        callee !== undefined &&
        callee.type === 'MemberExpression' &&
        callee.object.type === 'Identifier' &&
        callee.object.name === 'ReactDOM' &&
        callee.property.type === 'Identifier' &&
        callee.property.name === 'render'
      ) {
        // replace ReactDOM.render with
        // const root = ReactDOMClient.createRoot(container);
        // await act(() => { root.render() })
        const [element, container] = path.node.expression.arguments;
        j(path).insertBefore([
          j.variableDeclaration('const', [
            j.variableDeclarator(
              j.identifier('root'),
              j.callExpression(
                j.memberExpression(
                  j.identifier('ReactDOMClient'),
                  j.identifier('createRoot'),
                ),
                [container],
              ),
            ),
          ]),
        ]);
        j(path).replaceWith(
          j.expressionStatement(
            j.awaitExpression(
              j.callExpression(j.identifier('act'), [
                j.arrowFunctionExpression(
                  [],
                  j.blockStatement([
                    j.expressionStatement(
                      j.callExpression(
                        j.memberExpression(
                          j.identifier('root'),
                          j.identifier('render'),
                        ),
                        [element],
                      ),
                    ),
                  ]),
                ),
              ]),
            ),
          ),
        );

        path.parent.parent.value.async = true;
      } else if (
        callee !== undefined &&
        callee.type === 'MemberExpression' &&
        callee.object.type === 'Identifier' &&
        callee.object.name === 'ReactTestUtils' &&
        callee.property.type === 'Identifier' &&
        callee.property.name === 'renderIntoDocument'
      ) {
        // replace ReactTestUtils.renderIntoDocument with
        // const container = document.createElement('div')
        // const root = ReactDOMClient.createRoot(container);
        // await act(() => { root.render() })
        const [element] = path.node.expression.arguments;
        j(path).insertBefore([
          j.variableDeclaration('const', [
            j.variableDeclarator(
              j.identifier('container'),
              j.callExpression(j.identifier('document.createElement'), [
                j.literal('div'),
              ]),
            ),
          ]),
          j.variableDeclaration('const', [
            j.variableDeclarator(
              j.identifier('root'),
              j.callExpression(
                j.memberExpression(
                  j.identifier('ReactDOMClient'),
                  j.identifier('createRoot'),
                ),
                [j.identifier('container')],
              ),
            ),
          ]),
        ]);
        j(path).replaceWith(
          j.expressionStatement(
            j.awaitExpression(
              j.callExpression(j.identifier('act'), [
                j.arrowFunctionExpression(
                  [],
                  j.blockStatement([
                    j.expressionStatement(
                      j.callExpression(
                        j.memberExpression(
                          j.identifier('root'),
                          j.identifier('render'),
                        ),
                        [element],
                      ),
                    ),
                  ]),
                ),
              ]),
            ),
          ),
        );

        path.parent.parent.value.async = true;
      }
    })
    .find(j.VariableDeclaration)
    .forEach(path => {
      const {
        node: {declarations},
      } = path;
      if (
        declarations.length === 1 &&
        declarations[0].init !== null &&
        declarations[0].init.type === 'CallExpression'
      ) {
        const {arguments: args, callee} = declarations[0].init;
        if (
          callee !== undefined &&
          callee.type === 'MemberExpression' &&
          callee.object.type === 'Identifier' &&
          callee.object.name === 'ReactDOM' &&
          callee.property.type === 'Identifier' &&
          callee.property.name === 'render'
        ) {
          // replace const node = ReactDOM.render(element, container) with
          // const root = ReactDOMClient.createRoot(container);
          // await act(() => { root.render() })
          // const node = container.firstChild;
          const [element, container] = args;
          j(path).insertBefore([
            j.variableDeclaration('const', [
              j.variableDeclarator(
                j.identifier('root'),
                j.callExpression(
                  j.memberExpression(
                    j.identifier('ReactDOMClient'),
                    j.identifier('createRoot'),
                  ),
                  [container],
                ),
              ),
            ]),
            j.expressionStatement(
              j.awaitExpression(
                j.callExpression(j.identifier('act'), [
                  j.arrowFunctionExpression(
                    [],
                    j.blockStatement([
                      j.expressionStatement(
                        j.callExpression(
                          j.memberExpression(
                            j.identifier('root'),
                            j.identifier('render'),
                          ),
                          [element],
                        ),
                      ),
                    ]),
                  ),
                ]),
              ),
            ),
          ]);
          j(path).replaceWith(
            j.variableDeclaration('const', [
              j.variableDeclarator(
                j.identifier(declarations[0].id.name),
                j.identifier('container.firstChild'),
              ),
            ]),
          );

          path.parent.parent.value.async = true;
        }
      }
    })
    .toSource();
}
