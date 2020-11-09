/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
    createReactNativeComponentClass = require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface')
      .ReactNativeViewConfigRegistry.register;
    View = createReactNativeComponentClass('RCTView', () => ({
      validAttributes: {},
      uiViewClassName: 'RCTView',
    }));
    Text = createReactNativeComponentClass('RCTText', () => ({
      validAttributes: {},
      uiViewClassName: 'RCTText',
    }));

    ReactNativeFlightRelayServer = require('react-transport-native-relay/server');
    ReactNativeFlightRelayClient = require('react-transport-native-relay');
    JSResourceReferenceImpl = require('JSResourceReferenceImpl');
  });

  function readThrough(data) {
    const response = ReactNativeFlightRelayClient.createResponse();
    for (let i = 0; i < data.length; i++) {
      const chunk = data[i];
      if (chunk.type === 'json') {
        ReactNativeFlightRelayClient.resolveModel(
          response,
          chunk.id,
          chunk.json,
        );
      } else if (chunk.type === 'module') {
        ReactNativeFlightRelayClient.resolveModule(
          response,
          chunk.id,
          chunk.json,
        );
      } else {
        ReactNativeFlightRelayClient.resolveError(
          response,
          chunk.id,
          chunk.json.message,
          chunk.json.stack,
        );
      }
    }
    ReactNativeFlightRelayClient.close(response);
    const model = response.readRoot();
    return model;
  }

  it('can render a server component', () => {
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

    const model = readThrough(transport);
    expect(model).toMatchSnapshot();
  });

  it('can render a client component using a module reference and render there', () => {
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

    const model = {
      greeting: <Greeting firstName="Seb" lastName="Smith" />,
    };

    const transport = [];
    ReactNativeFlightRelayServer.render(model, transport);

    const modelClient = readThrough(transport);

    ReactFabric.render(modelClient.greeting, 1);
    expect(
      nativeFabricUIManager.__dumpHierarchyForJestTestsOnly(),
    ).toMatchSnapshot();
  });
});
