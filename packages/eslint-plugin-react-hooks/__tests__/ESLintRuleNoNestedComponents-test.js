/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const ESLintTester = require('eslint').RuleTester;
const ReactHooksESLintPlugin = require('eslint-plugin-react-hooks');
const ReactHooksESLintRule =
  ReactHooksESLintPlugin.rules['no-nested-components'];

/**
 * A string template tag that removes padding from the left side of multi-line strings
 * @param {Array} strings array of code strings (only one expected)
 */
function normalizeIndent(strings) {
  const codeLines = strings[0].split('\n');
  const leftPadding = codeLines[1].match(/\s+/)[0];
  return codeLines.map(line => line.substr(leftPadding.length)).join('\n');
}

// ***************************************************
// For easier local testing, you can add to any case:
// {
//   skip: true,
//   --or--
//   only: true,
//   ...
// }
// ***************************************************

// Tests that are valid/invalid across all parsers
const tests = {
  valid: [
    {
      code: normalizeIndent`
        function ParentComponent() {
          return (
            <div>
              <OutsideDefinedFunctionComponent />
            </div>
          );
        }
      `,
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          return React.createElement(
            "div",
            null,
            React.createElement(OutsideDefinedFunctionComponent, null)
          );
        }
      `,
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          return (
            <SomeComponent
              footer={<OutsideDefinedComponent />}
              header={<div />}
              />
          );
        }
      `,
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          return React.createElement(SomeComponent, {
            footer: React.createElement(OutsideDefinedComponent, null),
            header: React.createElement("div", null)
          });
        }
      `,
    },
    {
      //false-negative due to unknown display name: memoized component
      code: normalizeIndent`
        function ParentComponent() {
          const MemoizedNestedComponent = React.useCallback(() => <div />, []);

          return (
            <div>
              <MemoizedNestedComponent />
            </div>
          );
        }
      `,
    },
    {
      // false-negative due to unknown display name: memoized component
      code: normalizeIndent`
        function ParentComponent() {
          const MemoizedNestedComponent = React.useCallback(
            () => React.createElement("div", null),
            []
          );

          return React.createElement(
            "div",
            null,
            React.createElement(MemoizedNestedComponent, null)
          );
        }
      `,
    },
    {
      // false-negative due to unknown display name: memoized component
      code: normalizeIndent`
        function ParentComponent() {
          const MemoizedNestedFunctionComponent = React.useCallback(
            function () {
              return <div />;
            },
            []
          );

          return (
            <div>
              <MemoizedNestedFunctionComponent />
            </div>
          );
        }
      `,
    },
    {
      // false-negative due to unknown display name: memoized component
      code: normalizeIndent`
        function ParentComponent() {
          const MemoizedNestedFunctionComponent = React.useCallback(
            function () {
              return React.createElement("div", null);
            },
            []
          );

          return React.createElement(
            "div",
            null,
            React.createElement(MemoizedNestedFunctionComponent, null)
          );
        }
      `,
    },
    {
      code: normalizeIndent`
        function ParentComponent(props) {
          // Should not interfere handler declarations
          function onClick(event) {
            props.onClick(event.target.value);
          }

          const onKeyPress = () => null;

          function getOnHover() {
            return function onHover(event) {
              props.onHover(event.target);
            }
          }

          return (
            <div>
              <button
                onClick={onClick}
                onKeyPress={onKeyPress}
                onHover={getOnHover()}

                // These should not be considered as components
                maybeComponentOrHandlerNull={() => null}
                maybeComponentOrHandlerUndefined={() => undefined}
                maybeComponentOrHandlerBlank={() => ''}
                maybeComponentOrHandlerString={() => 'hello-world'}
                maybeComponentOrHandlerNumber={() => 42}
                maybeComponentOrHandlerArray={() => []}
                maybeComponentOrHandlerObject={() => {}} />
            </div>
          );
        }
      `,
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          function getComponent() {
            return <div />;
          }

          return (
            <div>
              {getComponent()}
            </div>
          );
        }
      `,
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          function getComponent() {
            return React.createElement("div", null);
          }

          return React.createElement("div", null, getComponent());
        }
      `,
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
            return (
              <RenderPropComponent>
                {() => <div />}
              </RenderPropComponent>
            );
        }
      `,
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
            return (
              <RenderPropComponent children={() => <div />} />
            );
        }
      `,
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          return (
            <ComplexRenderPropComponent
              listRenderer={data.map((items, index) => (
                <ul>
                  {items[index].map((item) =>
                    <li>
                      {item}
                    </li>
                  )}
                </ul>
              ))
              }
            />
          );
        }
      `,
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          return React.createElement(
              RenderPropComponent,
              null,
              () => React.createElement("div", null)
          );
        }
      `,
    },
    {
      code: normalizeIndent`
        function ParentComponent(props) {
          return (
            <ul>
              {props.items.map(item => (
                <li key={item.id}>
                  {item.name}
                </li>
              ))}
            </ul>
          );
        }
      `,
    },
    {
      code: normalizeIndent`
        function ParentComponent(props) {
          return (
            <List items={props.items.map(item => {
              return (
                <li key={item.id}>
                  {item.name}
                </li>
              );
            })}
            />
          );
        }
      `,
    },
    {
      code: normalizeIndent`
        function ParentComponent(props) {
          return React.createElement(
            "ul",
            null,
            props.items.map(() =>
              React.createElement(
                "li",
                { key: item.id },
                item.name
              )
            )
          )
        }
      `,
    },
    {
      code: normalizeIndent`
        function createTestComponent(props) {
          return (
            <div />
          );
        }
      `,
    },
    {
      code: normalizeIndent`
        function createTestComponent(props) {
          return React.createElement("div", null);
        }
      `,
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          return (
            <ComponentWithProps footer={() => <div />} />
          );
        }
      `,
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          return React.createElement(ComponentWithProps, {
            footer: () => React.createElement("div", null)
          });
        }
      `,
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          return (
            <SomeComponent item={{ children: () => <div /> }} />
          )
        }
      `,
    },
    {
      code: normalizeIndent`
      function ParentComponent() {
        return (
          <SomeComponent>
            {
              thing.match({
                renderLoading: () => <div />,
                renderSuccess: () => <div />,
                renderFailure: () => <div />,
              })
            }
          </SomeComponent>
        )
      }
      `,
    },
    {
      code: normalizeIndent`
      function ParentComponent() {
        const thingElement = thing.match({
          renderLoading: () => <div />,
          renderSuccess: () => <div />,
          renderFailure: () => <div />,
        });
        return (
          <SomeComponent>
            {thingElement}
          </SomeComponent>
        )
      }
      `,
    },
    {
      code: normalizeIndent`
      function ParentComponent() {
        return (
          <SomeComponent>
            {
              thing.match({
                loading: () => <div />,
                success: () => <div />,
                failure: () => <div />,
              })
            }
          </SomeComponent>
        )
      }
      `,
    },
    {
      code: normalizeIndent`
      function ParentComponent() {
        const thingElement = thing.match({
          loading: () => <div />,
          success: () => <div />,
          failure: () => <div />,
        });
        return (
          <SomeComponent>
            {thingElement}
          </SomeComponent>
        )
      }
      `,
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          return (
            <ComponentForProps renderFooter={() => <div />} />
          );
        }
      `,
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          return React.createElement(ComponentForProps, {
            renderFooter: () => React.createElement("div", null)
          });
        }
      `,
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          useEffect(() => {
            return () => null;
          });

          return <div />;
        }
      `,
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          return (
            <SomeComponent renderMenu={() => (
              <RenderPropComponent>
                {items.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </RenderPropComponent>
            )} />
          )
        }
      `,
    },
    {
      code: normalizeIndent`
        const ParentComponent = () => (
          <SomeComponent
            components={[
              <ul>
                {list.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>,
            ]}
          />
        );
     `,
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          const rows = [
            {
              name: 'A',
              render: (props) => <Row {...props} />
            },
          ];

          return <Table rows={rows} />;
        }
      `,
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          return <SomeComponent renderers={{ notComponent: () => null }} />;
        }
      `,
    },
    {
      code: normalizeIndent`
        const ParentComponent = createReactClass({
          displayName: "ParentComponent",
          statics: {
            getSnapshotBeforeUpdate: function () {
              return null;
            },
          },
          render() {
            return <div />;
          },
        });
      `,
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          const rows = [
            {
              name: 'A',
              notPrefixedWithRender: (props) => <Row {...props} />
            },
          ];

          return <Table rows={rows} />;
        }
      `,
    },
    /* TODO These minor cases are currently falsely marked due to component detection
    {
      code: normalizeIndent`
        function ParentComponent() {
          const _renderHeader = () => <div />;
          return <div>{_renderHeader()}</div>;
        }
      `
    },
    {
      // https://github.com/emotion-js/emotion/blob/a89d4257b0246a1640a99f77838e5edad4ec4386/packages/jest/test/react-enzyme.test.js#L26-L28
      code: normalizeIndent`
        const testCases = {
          basic: {
            render() {
              const Component = () => <div />;
              return <div />;
            }
          }
        }
        `
    },
    */
    {
      code: normalizeIndent`
      function ParentComponent() {
        const rows = [
          {
            name: 'A',
            notPrefixedWithRender: (props) => <Row {...props} />
          },
        ];
        return <Table rows={rows} />;
      }
      `,
    },

    {
      code: normalizeIndent`
      function ParentComponent() {
        return (
          <SomeComponent>
            {
              thing.match({
                loading: () => <div />,
                success: () => <div />,
                failure: () => <div />,
              })
            }
          </SomeComponent>
        )
      }
      `,
    },
    {
      code: normalizeIndent`
      function ParentComponent() {
        const thingElement = thing.match({
          loading: () => <div />,
          success: () => <div />,
          failure: () => <div />,
        });
        return (
          <SomeComponent>
            {thingElement}
          </SomeComponent>
        )
      }
      `,
    },
    // false-negative React.Component#render
    {
      code: normalizeIndent`
        class ParentComponent extends React.Component {
          render() {
            const List = (props) => {
              const items = props.items
                .map((item) => (
                  <li key={item.key}>
                    <span>{item.name}</span>
                  </li>
                ));
              return <ul>{items}</ul>;
            };
            return <List {...this.props} />;
          }
        }
      `,
    },
    {
      code: normalizeIndent`
        function ComponentForProps(props) {
          return React.createElement("div", null);
        }
        function ParentComponent() {
          return React.createElement(ComponentForProps, {
            notPrefixedWithRender: () => React.createElement("div", null)
          });
        }
      `,
    },
    {
      code: normalizeIndent`
        function ComponentForProps(props) {
          return <div />;
        }
        function ParentComponent() {
          return (
            <ComponentForProps notPrefixedWithRender={() => <div />} />
          );
        }
      `,
    },
    {
      code: normalizeIndent`
        function ComponentWithProps(props) {
          return React.createElement("div", null);
        }
        function ParentComponent() {
          return React.createElement(ComponentWithProps, {
            footer: () => React.createElement("div", null)
          });
        }
      `,
    },
    {
      code: normalizeIndent`
        function ComponentWithProps(props) {
          return <div />;
        }
        function ParentComponent() {
          return (
            <ComponentWithProps footer={() => <div />} />
          );
        }
      `,
    },
    {
      code: normalizeIndent`
        class ParentComponent extends React.Component {
          render() {
            const UnstableNestedClassComponent = () => {
              return React.createElement("div", null);
            }
            return React.createElement(
              "div",
              null,
              React.createElement(UnstableNestedClassComponent, null)
            );
          }
        }
      `,
    },
    // false-negative React.Component#render
    {
      code: normalizeIndent`
        class ParentComponent extends React.Component {
          render() {
            const UnstableNestedVariableComponent = () => {
              return <div />;
            }
            return (
              <div>
                <UnstableNestedVariableComponent />
              </div>
            );
          }
        }
      `,
    },
    // false-negative React.Component#render
    {
      code: normalizeIndent`
        class ParentComponent extends React.Component {
          render() {
            function UnstableNestedClassComponent() {
              return React.createElement("div", null);
            }
            return React.createElement(
              "div",
              null,
              React.createElement(UnstableNestedClassComponent, null)
            );
          }
        }
      `,
    },
    // false-negative React.Component#render
    {
      code: normalizeIndent`
        class ParentComponent extends React.Component {
          render() {
            function UnstableNestedFunctionComponent() {
              return <div />;
            }
            return (
              <div>
                <UnstableNestedFunctionComponent />
              </div>
            );
          }
        }
      `,
    },
    // false-negative React.Component#render
    {
      code: normalizeIndent`
        class ParentComponent extends React.Component {
          render() {
            class UnstableNestedClassComponent extends React.Component {
              render() {
                return React.createElement("div", null);
              }
            }
            return React.createElement(
              "div",
              null,
              React.createElement(UnstableNestedClassComponent, null)
            );
          }
        }
      `,
    },
    // false-negative React.Component#render
    {
      code: normalizeIndent`
        class ParentComponent extends React.Component {
          render() {
            class UnstableNestedClassComponent extends React.Component {
              render() {
                return <div />;
              }
            };
            return (
              <div>
                <UnstableNestedClassComponent />
              </div>
            );
          }
        }
      `,
    },
    // false-negative ClassComponent declaration
    {
      code: normalizeIndent`
        function ParentComponent() {
          class UnstableNestedClassComponent extends React.Component {
            render() {
              return React.createElement("div", null);
            }
          }
          return React.createElement(
            "div",
            null,
            React.createElement(UnstableNestedClassComponent, null)
          );
        }
      `,
      errors: [
        {messageId: 'declarationDuringRender', data: {displayName: 'Unknown'}},
      ],
    },
    // false-negative ClassComponent declaration
    {
      code: normalizeIndent`
        function ParentComponent() {
          class UnstableNestedClassComponent extends React.Component {
            render() {
              return <div />;
            }
          };
          return (
            <div>
              <UnstableNestedClassComponent />
            </div>
          );
        }
      `,
      errors: [
        {messageId: 'declarationDuringRender', data: {displayName: 'Unknown'}},
      ],
    },
    // intentional false-negative consistent with rules-of-hooks
    {
      code: normalizeIndent`
        export default () => {
          function UnstableNestedFunctionComponent() {
            return React.createElement("div", null);
          }
          return React.createElement(
            "div",
            null,
            React.createElement(UnstableNestedFunctionComponent, null)
          );
        };
      `,
    },
    // intentional false-negative consistent with rules-of-hooks
    {
      code: normalizeIndent`
        export default () => {
          function UnstableNestedFunctionComponent() {
            return <div />;
          }
          return (
            <div>
              <UnstableNestedFunctionComponent />
            </div>
          );
        }
      `,
    },
    {
      code: normalizeIndent`
        const Component = React.memo(React.forwardRef(() => {
          React.useRef();
        }))
      `,
    },
  ],
  invalid: [
    {
      code: normalizeIndent`
        function ParentComponent() {
          function UnstableNestedFunctionComponent() {
            return <div />;
          }
          return (
            <div>
              <UnstableNestedFunctionComponent />
            </div>
          );
        }
      `,
      errors: [
        {
          messageId: 'declarationDuringRender',
          data: {displayName: 'UnstableNestedFunctionComponent'},
        },
      ],
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          function UnstableNestedFunctionComponent() {
            return React.createElement("div", null);
          }
          return React.createElement(
            "div",
            null,
            React.createElement(UnstableNestedFunctionComponent, null)
          );
        }
      `,
      errors: [
        {
          messageId: 'declarationDuringRender',
          data: {displayName: 'UnstableNestedFunctionComponent'},
        },
      ],
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          const UnstableNestedVariableComponent = () => {
            return <div />;
          }
          return (
            <div>
              <UnstableNestedVariableComponent />
            </div>
          );
        }
      `,
      errors: [
        {
          messageId: 'declarationDuringRender',
          data: {displayName: 'UnstableNestedVariableComponent'},
        },
      ],
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          const UnstableNestedVariableComponent = () => {
            return React.createElement("div", null);
          }
          return React.createElement(
            "div",
            null,
            React.createElement(UnstableNestedVariableComponent, null)
          );
        }
      `,
      errors: [
        {
          messageId: 'declarationDuringRender',
          data: {displayName: 'UnstableNestedVariableComponent'},
        },
      ],
    },
    {
      code: normalizeIndent`
        const ParentComponent = () => {
          function UnstableNestedFunctionComponent() {
            return <div />;
          }
          return (
            <div>
              <UnstableNestedFunctionComponent />
            </div>
          );
        }
      `,
      errors: [
        {
          messageId: 'declarationDuringRender',
          data: {displayName: 'UnstableNestedFunctionComponent'},
        },
      ],
    },
    {
      code: normalizeIndent`
        const ParentComponent = () => {
          function UnstableNestedFunctionComponent() {
            return React.createElement("div", null);
          }
          return React.createElement(
            "div",
            null,
            React.createElement(UnstableNestedFunctionComponent, null)
          );
        }
      `,
      errors: [
        {
          messageId: 'declarationDuringRender',
          data: {displayName: 'UnstableNestedFunctionComponent'},
        },
      ],
    },
    {
      code: normalizeIndent`
        const ParentComponent = () => {
          const UnstableNestedVariableComponent = () => {
            return <div />;
          }
          return (
            <div>
              <UnstableNestedVariableComponent />
            </div>
          );
        }
      `,
      errors: [
        {
          messageId: 'declarationDuringRender',
          data: {displayName: 'UnstableNestedVariableComponent'},
        },
      ],
    },
    {
      code: normalizeIndent`
        const ParentComponent = () => {
          const UnstableNestedVariableComponent = () => {
            return React.createElement("div", null);
          }
          return React.createElement(
            "div",
            null,
            React.createElement(UnstableNestedVariableComponent, null)
          );
        }
      `,
      errors: [
        {
          messageId: 'declarationDuringRender',
          data: {displayName: 'UnstableNestedVariableComponent'},
        },
      ],
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          function getComponent() {
            function NestedUnstableFunctionComponent() {
              return <div />;
            };
            return <NestedUnstableFunctionComponent />;
          }
          return (
            <div>
              {getComponent()}
            </div>
          );
        }
      `,
      errors: [
        {
          messageId: 'declarationDuringRender',
          data: {displayName: 'NestedUnstableFunctionComponent'},
        },
      ],
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          function getComponent() {
            function NestedUnstableFunctionComponent() {
              return React.createElement("div", null);
            }
            return React.createElement(NestedUnstableFunctionComponent, null);
          }
          return React.createElement("div", null, getComponent());
        }
      `,
      errors: [
        {
          messageId: 'declarationDuringRender',
          data: {displayName: 'NestedUnstableFunctionComponent'},
        },
      ],
    },
    {
      code: normalizeIndent`
        function ComponentWithProps(props) {
          return <div />;
        }
        function ParentComponent() {
          return (
            <ComponentWithProps
              footer={
                function SomeFooter() {
                  return <div />;
                }
              } />
          );
        }
      `,
      errors: [
        {
          messageId: 'declarationDuringRender',
          data: {displayName: 'SomeFooter'},
        },
      ],
    },
    {
      code: normalizeIndent`
        function ComponentWithProps(props) {
          return React.createElement("div", null);
        }
        function ParentComponent() {
          return React.createElement(ComponentWithProps, {
            footer: function SomeFooter() {
              return React.createElement("div", null);
            }
          });
        }
      `,
      errors: [
        {
          messageId: 'declarationDuringRender',
          data: {displayName: 'SomeFooter'},
        },
      ],
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
            return (
              <RenderPropComponent>
                {() => {
                  function UnstableNestedComponent() {
                    return <div />;
                  }
                  return (
                    <div>
                      <UnstableNestedComponent />
                    </div>
                  );
                }}
              </RenderPropComponent>
            );
        }
      `,
      errors: [
        {
          messageId: 'declarationDuringRender',
          data: {displayName: 'UnstableNestedComponent'},
        },
      ],
    },
    {
      code: normalizeIndent`
        function RenderPropComponent(props) {
          return props.render({});
        }
        function ParentComponent() {
          return React.createElement(
            RenderPropComponent,
            null,
            () => {
              function UnstableNestedComponent() {
                return React.createElement("div", null);
              }
              return React.createElement(
                "div",
                null,
                React.createElement(UnstableNestedComponent, null)
              );
            }
          );
        }
      `,
      errors: [
        {
          messageId: 'declarationDuringRender',
          data: {displayName: 'UnstableNestedComponent'},
        },
      ],
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          return (
            <ComponentForProps someMap={{ Header: () => <div /> }} />
          );
        }
      `,
      errors: [
        {messageId: 'declarationDuringRender', data: {displayName: 'Header'}},
      ],
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          const UnstableNestedComponent = React.memo(() => {
            return <div />;
          });
          return (
            <div>
              <UnstableNestedComponent />
            </div>
          );
        }
      `,
      errors: [
        {messageId: 'declarationDuringRender', data: {displayName: 'Unknown'}},
      ],
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          const UnstableNestedComponent = React.memo(
            () => React.createElement("div", null),
          );
          return React.createElement(
            "div",
            null,
            React.createElement(UnstableNestedComponent, null)
          );
        }
      `,
      errors: [
        {messageId: 'declarationDuringRender', data: {displayName: 'Unknown'}},
      ],
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          const UnstableNestedComponent = React.memo(
            function () {
              return <div />;
            }
          );
          return (
            <div>
              <UnstableNestedComponent />
            </div>
          );
        }
      `,
      errors: [
        {messageId: 'declarationDuringRender', data: {displayName: 'Unknown'}},
      ],
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          const UnstableNestedComponent = React.memo(
            function () {
              return React.createElement("div", null);
            }
          );
          return React.createElement(
            "div",
            null,
            React.createElement(UnstableNestedComponent, null)
          );
        }
      `,
      errors: [
        {messageId: 'declarationDuringRender', data: {displayName: 'Unknown'}},
      ],
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          return (
            <SomeComponent renderers={{ Header: () => <div /> }} />
          )
        }
      `,
      errors: [
        {messageId: 'declarationDuringRender', data: {displayName: 'Header'}},
      ],
    },
    {
      code: normalizeIndent`
        function ParentComponent(props) {
          return React.createElement(
            "ul",
            null,
            props.items.map(function Item() {
              return React.createElement(
                "li",
                { key: item.id },
                item.name
              );
            })
          );
        }
      `,
      errors: [
        {messageId: 'declarationDuringRender', data: {displayName: 'Item'}},
      ],
    },
    {
      code: normalizeIndent`
        function ParentComponent(props) {
          return (
            <ul>
              {props.items.map(function Item(item) {
                return (
                  <li key={item.id}>
                    {item.name}
                  </li>
                );
              })}
            </ul>
          );
        }
      `,
      errors: [
        {messageId: 'declarationDuringRender', data: {displayName: 'Item'}},
      ],
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          const UnstableNestedFunctionComponent = React.forwardRef(function UnstableNestedFunctionComponent(props, ref) {
            return <div {...props} ref={ref} />;
          });
          return (
            <div>
              <UnstableNestedForwardRefComponent />
            </div>
          );
        }
      `,
      errors: [
        {
          messageId: 'declarationDuringRender',
          data: {displayName: 'UnstableNestedFunctionComponent'},
        },
      ],
    },
    {
      code: normalizeIndent`
        function ParentComponent() {
          const MemoizedComponentn = React.useCallback(function Component() {});
          return (
            <MemoizedComponentn />
          );
        }
      `,
      errors: [
        {
          messageId: 'declarationDuringRender',
          data: {displayName: 'Component'},
        },
      ],
    },
  ],
};

// Tests that are only valid/invalid across parsers supporting Flow
const testsFlow = {
  valid: [],
  invalid: [],
};

// Tests that are only valid/invalid across parsers supporting TypeScript
const testsTypescript = {
  valid: [],
  invalid: [],
};

// For easier local testing
if (!process.env.CI) {
  let only = [];
  let skipped = [];
  [
    ...tests.valid,
    ...tests.invalid,
    ...testsFlow.valid,
    ...testsFlow.invalid,
    ...testsTypescript.valid,
    ...testsTypescript.invalid,
  ].forEach(t => {
    if (t.skip) {
      delete t.skip;
      skipped.push(t);
    }
    if (t.only) {
      delete t.only;
      only.push(t);
    }
  });
  const predicate = t => {
    if (only.length > 0) {
      return only.indexOf(t) !== -1;
    }
    if (skipped.length > 0) {
      return skipped.indexOf(t) === -1;
    }
    return true;
  };
  tests.valid = tests.valid.filter(predicate);
  tests.invalid = tests.invalid.filter(predicate);
  testsFlow.valid = testsFlow.valid.filter(predicate);
  testsFlow.invalid = testsFlow.invalid.filter(predicate);
  testsTypescript.valid = testsTypescript.valid.filter(predicate);
  testsTypescript.invalid = testsTypescript.invalid.filter(predicate);
}

describe('react-hooks', () => {
  const parserOptions = {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 6,
    sourceType: 'module',
  };

  const testsBabelEslint = {
    valid: [...testsFlow.valid, ...tests.valid],
    invalid: [...testsFlow.invalid, ...tests.invalid],
  };

  new ESLintTester({
    parser: require.resolve('babel-eslint'),
    parserOptions,
  }).run('parser: babel-eslint', ReactHooksESLintRule, testsBabelEslint);

  // new ESLintTester({
  //   parser: require.resolve('@babel/eslint-parser'),
  //   parserOptions,
  // }).run(
  //   'parser: @babel/eslint-parser',
  //   ReactHooksESLintRule,
  //   testsBabelEslint
  // );

  // const testsTypescriptEslintParser = {
  //   valid: [...testsTypescript.valid, ...tests.valid],
  //   invalid: [...testsTypescript.invalid, ...tests.invalid],
  // };

  // new ESLintTester({
  //   parser: require.resolve('@typescript-eslint/parser-v2'),
  //   parserOptions,
  // }).run(
  //   'parser: @typescript-eslint/parser@2.x',
  //   ReactHooksESLintRule,
  //   testsTypescriptEslintParser
  // );

  // new ESLintTester({
  //   parser: require.resolve('@typescript-eslint/parser-v3'),
  //   parserOptions,
  // }).run(
  //   'parser: @typescript-eslint/parser@3.x',
  //   ReactHooksESLintRule,
  //   testsTypescriptEslintParser
  // );

  // new ESLintTester({
  //   parser: require.resolve('@typescript-eslint/parser-v5'),
  //   parserOptions,
  // }).run('parser: @typescript-eslint/parser@^5.0.0-0', ReactHooksESLintRule, {
  //   valid: testsTypescriptEslintParser.valid,
  //   invalid: testsTypescriptEslintParser.invalid,
  // });
});
