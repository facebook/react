let React;
let ReactFeatureFlags;
let ReactNoop;
let Scheduler;
let Suspense;

const fc = require('fast-check');

const beforeEachAction = () => {
  jest.resetModules();
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
  ReactFeatureFlags.enableSuspenseServerRenderer = true;
  React = require('react');
  ReactNoop = require('react-noop-renderer');
  Scheduler = require('scheduler');
  Suspense = React.Suspense;
};

function flushAndYieldScheduler() {
  Scheduler.unstable_flushAllWithoutAsserting();
  Scheduler.unstable_clearYields();
}

function Text({text}) {
  return <span>{text}</span>;
}

function AsyncText({text, readOrThrow}) {
  readOrThrow(text);
  return <span>{text}</span>;
}

function withCustomError(gens, customToString) {
  return fc.record(gens).map(out => {
    return {
      ...out,
      toString() {
        return `
Raw failure:
${fc.stringify(out)}

Formated failure:
${customToString(out)}`;
      },
    };
  });
}

describe('ReactSuspense', () => {
  beforeEach(beforeEachAction);

  it('render based on the latest state', async () => {
    await fc.assert(
      fc
        .asyncProperty(
          withCustomError(
            {
              // Scheduler able to re-order operations
              s: fc.scheduler(),
              // The initial text defined in the App component
              initialText: fc.stringOf(fc.hexa()),
              // Array of updates with the associated priority
              textUpdates: fc.array(
                fc.record({
                  // Priority of the task
                  priority: fc.constantFrom(
                    Scheduler.unstable_ImmediatePriority,
                    Scheduler.unstable_UserBlockingPriority,
                    Scheduler.unstable_NormalPriority,
                    Scheduler.unstable_IdlePriority,
                    Scheduler.unstable_LowPriority,
                  ),
                  // Value to set for text
                  text: fc.stringOf(fc.hexa()),
                }),
              ),
            },
            ({s, initialText, textUpdates}) => {
              // This list of actions could be directly exposed by fast-check
              const actions = s
                .toString()
                .split('\n')
                .filter(line => line.includes('-> [task#'))
                .map(line =>
                  JSON.parse(line.split('::', 2)[1].split(' resolved')[0]),
                );
              return `
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { unstable_runWithPriority } from "scheduler";

function createResource(name) {
  let resolved = false;
  let resolve;
  let promise = new Promise(r => (resolve = r));
  return {
    name,
    read() {
      console.log(\`Reading \${JSON.stringify(name)}\`);
      if (!resolved) throw promise;
    },
    resolve() {
      console.log(\`Resolving \${JSON.stringify(name)}\`);
      resolved = true;
      resolve();
    }
  };
}

let _setText;
const resources = new Map();
${actions
  .map(a => {
    const escapedText = JSON.stringify(a.text);
    return `resources.set(${escapedText}, createResource(${escapedText}));`;
  })
  .join('\n')}

${actions
  .map((a, id) => {
    const escapedText = JSON.stringify(a.text);
    const delay = (id + 1) * 1000;
    if (a.type === 'request') {
      return `setTimeout(() => resources.get(${escapedText}).resolve(), ${delay});`;
    } else if (a.type === 'scheduler') {
      return `setTimeout(() => unstable_runWithPriority(${a.priority}, () => _setText(${escapedText})), ${delay});`;
    }
    return '// UNEXPECTED ACTION...';
  })
  .join('\n')}

function App() {
  const [text, setText] = useState(${JSON.stringify(initialText)});
  _setText = setText;
  const res = resources.get(text);
  res.read();
  return <span>{res.name}</span>;
}

const rootElement = document.getElementById("root");
ReactDOM.createRoot(
  rootElement
).render(
  <React.Suspense fallback={<h1>Loading the app...</h1>}>
    <App />
  </React.Suspense>
);
              `;
            },
          ),
          // The code under test
          async ({s, initialText, textUpdates}) => {
            // We simulate a cache: string -> Promise
            // It may contain successes and rejections
            const cache = new Map();
            const readOrThrow = text => {
              if (cache.has(text)) {
                // The text has already been queried
                const {promise, resolvedWith} = cache.get(text);
                // Not resolved yet?
                if (resolvedWith === null) throw promise;
                // Success
                return text;
              } else {
                // Not yet queried
                const promise = s.schedule(
                  Promise.resolve(),
                  JSON.stringify({type: 'request', text}),
                );
                const cachedValue = {promise, resolvedWith: null};
                promise.then(success => (cachedValue.resolvedWith = {success}));
                cache.set(text, cachedValue);
                throw promise;
              }
            };

            let setText;
            function App() {
              const [text, _setText] = React.useState(initialText);
              setText = _setText;
              return <AsyncText text={text} readOrThrow={readOrThrow} />;
            }

            // Initial render
            ReactNoop.render(
              <Suspense fallback={<Text text="Loading..." />}>
                <App />
              </Suspense>,
            );
            flushAndYieldScheduler();
            expect(ReactNoop).toMatchRenderedOutput(<span>Loading...</span>);

            // Schedule updates into the scheduler
            // Updates will not be reordered
            // BUT promises that they may trigger may be scheduled in-between
            s.scheduleSequence(
              textUpdates.map(update => {
                return {
                  label: JSON.stringify({type: 'scheduler', ...update}),
                  builder: async () =>
                    Scheduler.unstable_runWithPriority(update.priority, () => {
                      setText(update.text);
                    }),
                };
              }),
            );

            // Exhaust the queue of scheduled tasks
            while (s.count() !== 0) {
              await ReactNoop.act(async () => {
                await s.waitOne();
                flushAndYieldScheduler();
              });
            }

            // Check the final value is the expected one
            const lastText =
              textUpdates.length > 0
                ? textUpdates[textUpdates.length - 1].text
                : initialText;
            expect(ReactNoop).toMatchRenderedOutput(<span>{lastText}</span>);
          },
        )
        .beforeEach(beforeEachAction),
    );
  });
});
