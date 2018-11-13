/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code#Code_values
 * @param {object} nativeEvent
 * @returns {string} Standardized keyboard code value if defined natively
 */
function getEventCode(nativeEvent: KeyboardEvent): string {
  if (__DEV__ && nativeEvent.code === undefined) {
    throw new ReferenceError(
      'KeyboardEvent.code does not exist in this environment',
    );
  }
  return nativeEvent.code;
}

export default getEventCode;
