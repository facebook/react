import {RawEventTelemetryEventEmitter} from 'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface';

const ReactNativeEventTelemetryPlugin = {
  extractEvents(
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags
  ) {
    RawEventTelemetryEventEmitter.emitEvent(topLevelType, nativeEvent);

    // We never extract events here, we just forward to the telemetry system.
    // Thus, returning null here unconditionally is optimal.
    return null;
  }
};

export default ReactNativeEventTelemetryPlugin;
