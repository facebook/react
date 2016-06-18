/**
 * Wraps a test function in an asynchronous test zone. The test will automatically
 * complete when all asynchronous calls within this zone are done. Can be used
 * to wrap an {@link inject} call.
 *
 * Example:
 *
 * ```
 * it('...', async(inject([AClass], (object) => {
 *   object.doSomething.then(() => {
 *     expect(...);
 *   })
 * });
 * ```
 */
export function async(fn: Function): Function {
  return () => new Promise<void>((finishCallback, failCallback) => {
           var AsyncTestZoneSpec = (Zone as any /** TODO #9100 */)['AsyncTestZoneSpec'];
           var testZoneSpec = new AsyncTestZoneSpec(finishCallback, failCallback, 'test');
           var testZone = Zone.current.fork(testZoneSpec);
           return testZone.run(fn);
         });
}
