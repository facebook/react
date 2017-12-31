/* @flow */

const MAX_STACK_DEPTH = 1000
const noop = _ => _

const defer = typeof process !== 'undefined' && process.nextTick
  ? process.nextTick
  : typeof Promise !== 'undefined'
    ? fn => Promise.resolve().then(fn)
    : typeof setTimeout !== 'undefined'
      ? setTimeout
      : noop

if (defer === noop) {
  throw new Error(
    'Your JavaScript runtime does not support any asynchronous primitives ' +
    'that are required by vue-server-renderer. Please use a polyfill for ' +
    'either Promise or setTimeout.'
  )
}

export function createWriteFunction (
  write: (text: string, next: Function) => boolean,
  onError: Function
): Function {
  let stackDepth = 0
  const cachedWrite = (text, next) => {
    if (text && cachedWrite.caching) {
      cachedWrite.cacheBuffer[cachedWrite.cacheBuffer.length - 1] += text
    }
    const waitForNext = write(text, next)
    if (waitForNext !== true) {
      if (stackDepth >= MAX_STACK_DEPTH) {
        defer(() => {
          try { next() } catch (e) {
            onError(e)
          }
        })
      } else {
        stackDepth++
        next()
        stackDepth--
      }
    }
  }
  cachedWrite.caching = false
  cachedWrite.cacheBuffer = []
  cachedWrite.componentBuffer = []
  return cachedWrite
}
