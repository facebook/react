const {createElement, Component, Suspense} = React;
const {createRoot} = ReactDOM;
const {
  unstable_subscribe: subscribe,
  unstable_trace: trace,
  unstable_wrap: wrap,
} = SchedulerTracing;

const createLogger = (backgroundColor, color, enabled) => (
  message,
  ...args
) => {
  if (enabled === false) return;
  console.groupCollapsed(
    `%c${message}`,
    `background-color: ${backgroundColor}; color: ${color}; padding: 2px 4px;`,
    ...args
  );
  console.log(
    new Error('stack').stack
      .split('\n')
      .slice(2)
      .join('\n')
  );
  console.groupEnd();
};

window.log = {
  app: createLogger('#37474f', '#fff'),
  interaction: createLogger('#6a1b9a', '#fff'),
  react: createLogger('#ff5722', '#fff'),
  tracing: createLogger('#2962ff', '#fff'),
  work: createLogger('#e1bee7', '#000'),
};

// Fake suspense
const resolvedValues = {};
const read = key => {
  if (!resolvedValues[key]) {
    log.app(`Suspending for "${key}" ...`);
    throw new Promise(
      wrap(resolve => {
        setTimeout(
          wrap(() => {
            log.app(`Loaded "${key}" ...`);
            resolvedValues[key] = true;
            resolve(key);
          }),
          1000
        );
      })
    );
  }
  return key;
};

const TestApp = () =>
  createElement(
    Suspense,
    {fallback: createElement(PlaceholderText)},
    createElement(SuspendingChild, {text: 'foo'}),
    createElement(SuspendingChild, {text: 'bar'}),
    createElement(SuspendingChild, {text: 'baz'})
  );

const PlaceholderText = () => 'Loading ...';

const SuspendingChild = ({text}) => {
  const resolvedValue = read(text);
  return resolvedValue;
};

subscribe({
  onInteractionScheduledWorkCompleted: interaction =>
    log.interaction(
      'onInteractionScheduledWorkCompleted',
      JSON.stringify(interaction)
    ),
  onInteractionTraced: interaction =>
    log.interaction('onInteractionTraced', JSON.stringify(interaction)),
  onWorkCanceled: interactions =>
    log.work('onWorkCanceled', JSON.stringify(Array.from(interactions))),
  onWorkScheduled: interactions =>
    log.work('onWorkScheduled', JSON.stringify(Array.from(interactions))),
  onWorkStarted: interactions =>
    log.work('onWorkStarted', JSON.stringify(Array.from(interactions))),
  onWorkStopped: interactions =>
    log.work('onWorkStopped', JSON.stringify(Array.from(interactions))),
});

const element = document.getElementById('root');
trace('initial_render', performance.now(), () => {
  const root = createRoot(element);
  log.app('render()');
  root.render(
    createElement(TestApp),
    wrap(() => {
      log.app('committed');
    })
  );
});
