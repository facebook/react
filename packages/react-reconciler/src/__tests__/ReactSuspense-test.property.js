let React;
let ReactFeatureFlags;
let ReactNoop;
let Scheduler;
let Suspense;

const {getParameters} = require('codesandbox/lib/api/define');
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

function buildCodeSandboxReporter(createFilesFromCounterexample) {
  return function reporter(runDetails) {
    if (!runDetails.failed) {
      return;
    }
    const counterexample = runDetails.counterexample;
    const originalErrorMessage = fc.defaultReportMessage(runDetails);
    if (counterexample === undefined) {
      throw new Error(originalErrorMessage);
    }
    const files = {
      ...createFilesFromCounterexample(...counterexample),
      'report.txt': {
        content: originalErrorMessage,
      },
    };
    const url = `https://codesandbox.io/api/v1/sandboxes/define?parameters=${getParameters(
      {files},
    )}`;
    throw new Error(`${originalErrorMessage}\n\nReproduction link: ${url}`);
  };
}

describe('ReactSuspense', () => {
  beforeEach(beforeEachAction);

  it('render based on the latest state', async () => {
    await fc.assert(
      fc
        .asyncProperty(
          // Scheduler able to re-order operations
          fc.scheduler(),
          // The initial text defined in the App component
          fc.stringOf(fc.hexa()),
          // Array of updates with the associated priority
          fc.array(
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
          // The code under test
          async (s, initialText, textUpdates) => {
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
                  `Resolve async request for text ${JSON.stringify(text)}`,
                  {type: 'request', text},
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
                  label: `Call setText(${JSON.stringify(
                    update.text,
                  )}) with priority ${update.priority}`,
                  metadata: {type: 'setText', ...update},
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
      {
        examples: [
          // If you want to replay failures or provide custom example, you can specify them here
          /*[
            fc.schedulerFor()`
        -> [task${2}] sequence::Call setText("1") with priority 1 resolved
        -> [task${1}] promise::Resolve async request for text "" resolved`,
            '',
            [{priority: 1, text: '1'}],
          ],*/
        ],
        reporter: buildCodeSandboxReporter((s, initialText, textUpdates) => {
          const actions = s.report();
          const allResources = new Set(actions.map(a => a.metadata.text));
          return {
            'package.json': {
              content: JSON.stringify(
                {
                  dependencies: {
                    react: '0.0.0-experimental-33c3af284',
                    'react-dom': '0.0.0-experimental-33c3af284',
                  },
                },
                undefined,
                2,
              ),
            },
            'report.counterexample.txt': {
              content: `
actions = ${JSON.stringify(actions, undefined, 2)};
initialText = ${JSON.stringify(initialText)};
textUpdates = ${JSON.stringify(textUpdates, undefined, 2)};
              `,
            },
            'data.js': {
              content: `
import { unstable_runWithPriority } from "scheduler";

export const initialText = ${JSON.stringify(initialText)};

let _setText;
export const defineSetText = (setText) => (_setText = setText);

function createResource(name) {
  let resolved = false;
  let resolve;
  let promise = new Promise(r => (resolve = r));
  return {
    get name() {
      if (!resolved) throw promise;
      return name;
    },
    resolve() {
      resolved = true;
      resolve();
    }
  };
}

function resolveResource(name) {
  console.log(\`Resolving resource for \${JSON.stringify(name)}\`);
  resourcesManager.get(name).resolve();
}

function updateState(priority, name) {
  console.log(\`Calling setText with \${JSON.stringify(name)}\`);
  unstable_runWithPriority(priority, () => _setText(name));
}

export const resourcesManager = new Map();
${Array.from(allResources)
  .map(text => {
    const escapedText = JSON.stringify(text);
    return `resourcesManager.set(${escapedText}, createResource(${escapedText}));`;
  })
  .join('\n')}

${actions
  .map((a, id) => {
    const escapedText = JSON.stringify(a.metadata.text);
    const delay = (id + 1) * 1000;
    if (a.metadata.type === 'request')
      return `setTimeout(() => resolveResource(${escapedText}), ${delay});`;
    if (a.metadata.type === 'setText')
      return `setTimeout(() => updateState(${a.metadata.priority}, ${escapedText}), ${delay});`;
  })
  .join('\n')}
              `,
            },
            'index.js': {
              content: `
import React, { useState } from "react";
import ReactDOM from "react-dom";
import { defineSetText, initialText, resourcesManager } from "./data";

function App() {
  const [text, setText] = useState(initialText);
  defineSetText(setText);

  console.log(\`Rendering App for text=\${JSON.stringify(text)}\`);
  const res = resourcesManager.get(text);
  return <span>{res.name}</span>; // res.name throws in case the requested data is not available
}

const rootElement = document.getElementById("root");
ReactDOM.unstable_createRoot(
  rootElement
).render(
  <React.Suspense fallback={<h1>Loading the app...</h1>}>
    <App />
  </React.Suspense>
);
              `,
            },
          };
        }),
      },
    );
  });
});
