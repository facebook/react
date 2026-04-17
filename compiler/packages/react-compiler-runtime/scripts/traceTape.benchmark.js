const {
  experimental_createRenderTraceSession,
  experimental_createTraceSelector,
} = require('../dist/index.js');

function createSnapshotRenderer(render) {
  let renders = 0;
  return {
    stats() {
      return {renders};
    },
    update(input) {
      renders++;
      return render(input);
    },
  };
}

const items = Array.from({length: 2000}, (_, index) => 'm' + index);

function createInput(count) {
  return {
    count,
    items,
    prefix: '#',
    showMeta: true,
    theme: 'dark',
    title: 'Inbox',
    user: 'ada',
  };
}

function expensiveChecksum(list) {
  let checksum = 0;
  for (let index = 0; index < list.length; index++) {
    checksum += list[index].length * (index + 1);
  }
  return checksum;
}

function snapshotRender(input) {
  return {
    body: input.prefix + input.count,
    meta: input.showMeta ? `${input.user}:${expensiveChecksum(input.items)}` : null,
    theme: input.theme === 'dark' ? '#fff' : '#111',
    title: input.title,
  };
}

const titleSelector = experimental_createTraceSelector('title', input => input.title);
const bodySelector = experimental_createTraceSelector('count', input => input.count);
const prefixSelector = experimental_createTraceSelector('prefix', input => input.prefix);
const themeSelector = experimental_createTraceSelector('theme', input => input.theme);
const showMetaSelector = experimental_createTraceSelector('showMeta', input => input.showMeta);
const userSelector = experimental_createTraceSelector('user', input => input.user);
const itemsSelector = experimental_createTraceSelector('items', input => input.items);

const traceSession = experimental_createRenderTraceSession((trace, input) => {
  trace.text('title', [titleSelector], data => data.title);
  trace.text('body', [prefixSelector, bodySelector], data => data.prefix + data.count);

  if (trace.guard(themeSelector) === 'dark') {
    trace.attr('root', 'color', [themeSelector], () => '#fff');
  } else {
    trace.attr('root', 'color', [themeSelector], () => '#111');
  }

  if (trace.guard(showMetaSelector)) {
    trace.text('meta', [userSelector, itemsSelector], data => {
      return `${data.user}:${expensiveChecksum(data.items)}`;
    });
  }
});

const snapshot = createSnapshotRenderer(snapshotRender);
const iterations = 20000;

let start = process.hrtime.bigint();
for (let iteration = 0; iteration < iterations; iteration++) {
  snapshot.update(createInput(iteration));
}
const snapshotDurationMs = Number(process.hrtime.bigint() - start) / 1e6;

start = process.hrtime.bigint();
for (let iteration = 0; iteration < iterations; iteration++) {
  traceSession.update(createInput(iteration));
}
const traceDurationMs = Number(process.hrtime.bigint() - start) / 1e6;

console.log(
  JSON.stringify(
    {
      iterations,
      snapshot: snapshot.stats(),
      snapshotDurationMs,
      traceDurationMs,
      traceSession: traceSession.stats(),
    },
    null,
    2,
  ),
);
