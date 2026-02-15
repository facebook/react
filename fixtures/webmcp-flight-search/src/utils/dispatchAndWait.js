/**
 * Dispatches a CustomEvent and waits for a corresponding completion event.
 * Used to bridge WebMCP tool execution (async) with React state updates.
 */
export function dispatchAndWait(
  eventName,
  detail = {},
  successMessage = 'Action completed successfully',
  timeoutMs = 5000
) {
  return new Promise((resolve, reject) => {
    const requestId = Math.random().toString(36).substring(2, 15);
    const completionEventName = `tool-completion-${requestId}`;

    const timeoutId = setTimeout(() => {
      window.removeEventListener(completionEventName, handleCompletion);
      reject(
        new Error(
          `Timed out waiting for UI to update (requestId: ${requestId})`
        )
      );
    }, timeoutMs);

    const handleCompletion = () => {
      clearTimeout(timeoutId);
      window.removeEventListener(completionEventName, handleCompletion);
      resolve(successMessage);
    };

    window.addEventListener(completionEventName, handleCompletion);

    const event = new CustomEvent(eventName, {
      detail: {...detail, requestId},
    });
    window.dispatchEvent(event);
  });
}
