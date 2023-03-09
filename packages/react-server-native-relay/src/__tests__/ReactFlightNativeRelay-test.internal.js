/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

let React;
let ReactFabric;
let createReactNativeComponentClass;
let View;
let Text;
let JSResourceReferenceImpl;
let ReactNativeFlightRelayServer;
let ReactNativeFlightRelayClient;

describe('ReactFlightNativeRelay', () => {
  beforeEach(() => {
    jest.resetModules();

    require('react-native/Libraries/ReactPrivate/InitializeNativeFabricUIManager');

    React = require('react');
    // TODO: Switch this out to react-native
    ReactFabric = require('react-native-renderer/fabric');
    createReactNativeComponentClass =
      require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface')
        .ReactNativeViewConfigRegistry.register;
    View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {},
      uiViewClassName: 'RCTView',
    }));
    Text = createReactNativeComponentClass('RCTText', () => ({
      validAttributes: {},
      uiViewClassName: 'RCTText',
    }));

    ReactNativeFlightRelayServer = require('react-server-native-relay/server');
    ReactNativeFlightRelayClient = require('react-server-native-relay');
    JSResourceReferenceImpl = require('JSResourceReferenceImpl');
  });

  function readThrough(data) {
    const response = ReactNativeFlightRelayClient.createResponse();
    for (let i = 0; i < data.length; i++) {
      const chunk = data[i];
      ReactNativeFlightRelayClient.resolveRow(response, chunk);
    }
    ReactNativeFlightRelayClient.close(response);
    const promise = ReactNativeFlightRelayClient.getRoot(response);
    let value;
    let error;
    promise.then(
      m => (value = m),
      e => (error = e),
    );
    if (error) {
      throw error;
    }
    return value;
  }

  it('can render a Server Component', () => {
    function Bar({text}) {
      return <Text>{text.toUpperCase()}</Text>;
    }
    function Foo() {
      return {
        bar: (
          <View>
            <Bar text="a" /> <Bar text="b" />
          </View>
        ),
      };
    }
    const transport = [];
    ReactNativeFlightRelayServer.render(
      {
        foo: <Foo />,
      },
      transport,
    );

    const value = readThrough(transport);
    expect(value).toMatchSnapshot();
  });

  it('can render a Client Component using a module reference and render there', () => {
    function UserClient(props) {
      return (
        <Text>
          {props.greeting}, {props.name}
        </Text>
      );
    }
    const User = new JSResourceReferenceImpl(UserClient);

    function Greeting({firstName, lastName}) {
      return <User greeting="Hello" name={firstName + ' ' + lastName} />;
    }

    const value = {
      greeting: <Greeting firstName="Seb" lastName="Smith" />,
    };

    const transport = [];
    ReactNativeFlightRelayServer.render(value, transport);

    const valueClient = readThrough(transport);

    ReactFabric.render(valueClient.greeting, 1);
    expect(
      nativeFabricUIManager.__dumpHierarchyForJestTestsOnly(),
    ).toMatchSnapshot();
  });

  it('should warn in DEV if a class instance polyfill is passed to a host component', () => {
    function Bar() {}

    function Foo() {}
    Foo.prototype = Object.create(Bar.prototype);
    // This is enumerable which some polyfills do.
    Foo.prototype.constructor = Foo;
    Foo.prototype.method = function () {};

    expect(() => {
      const transport = [];
      ReactNativeFlightRelayServer.render(
        <input value={new Foo()} />,
        transport,
      );
      readThrough(transport);
    }).toErrorDev(
      'Only plain objects can be passed to Client Components from Server Components. ',
      {withoutStack: true},
    );
  });
});
