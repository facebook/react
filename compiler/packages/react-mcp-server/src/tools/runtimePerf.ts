import * as babel from '@babel/core';
import puppeteer from 'puppeteer';
// @ts-ignore
import * as babelPresetTypescript from '@babel/preset-typescript';
// @ts-ignore
import * as babelPresetEnv from '@babel/preset-env';
// @ts-ignore
import * as babelPresetReact from '@babel/preset-react';

type PerformanceResults = {
  renderTime: number;
  webVitals: {
    cls: number;
    lcp: number;
    inp: number;
    fid: number;
    ttfb: number;
  };
  reactProfiler: {
    id: number;
    phase: number;
    actualDuration: number;
    baseDuration: number;
    startTime: number;
    commitTime: number;
  };
  error: Error | null;
};

export async function measurePerformance(
  code: string,
  iterations: number,
): Promise<PerformanceResults> {
  const babelOptions: babel.TransformOptions = {
    filename: 'anonymous.tsx',
    configFile: false,
    babelrc: false,
    presets: [babelPresetTypescript, babelPresetEnv, babelPresetReact],
  };

  const parsed = await babel.parseAsync(code, babelOptions);
  if (!parsed) {
    throw new Error('Failed to parse code');
  }

  const transformResult = await babel.transformFromAstAsync(parsed, undefined, {
    ...babelOptions,
    plugins: [
      () => ({
        visitor: {
          ImportDeclaration(
            path: babel.NodePath<babel.types.ImportDeclaration>,
          ) {
            const value = path.node.source.value;
            if (value === 'react' || value === 'react-dom') {
              path.remove();
            }
          },
        },
      }),
    ],
  });

  const transpiled = transformResult?.code || undefined;
  if (!transpiled) {
    throw new Error('Failed to transpile code');
  }

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({width: 1280, height: 720});
  const html = buildHtml(transpiled);

  let performanceResults: PerformanceResults = {
    renderTime: 0,
    webVitals: {
      cls: 0,
      lcp: 0,
      inp: 0,
      fid: 0,
      ttfb: 0,
    },
    reactProfiler: {
      id: 0,
      phase: 0,
      actualDuration: 0,
      baseDuration: 0,
      startTime: 0,
      commitTime: 0,
    },
    error: null,
  };

  for (let ii = 0; ii < iterations; ii++) {
    await page.setContent(html, {waitUntil: 'networkidle0'});
    await page.waitForFunction(
      'window.__RESULT__ !== undefined && (window.__RESULT__.renderTime !== null || window.__RESULT__.error !== null)',
    );
    // ui chaos monkey
    await page.waitForFunction(`window.__RESULT__ !== undefined && (function() {
      for (const el of [...document.querySelectorAll('a'), ...document.querySelectorAll('button')]) {
        console.log(el);
        el.click();
      }
      return true;
    })() `);
    const evaluationResult: PerformanceResults = await page.evaluate(() => {
      return (window as any).__RESULT__;
    });

    // TODO: investigate why webvital metrics are not populating correctly
    performanceResults.renderTime += evaluationResult.renderTime;
    performanceResults.webVitals.cls += evaluationResult.webVitals.cls || 0;
    performanceResults.webVitals.lcp += evaluationResult.webVitals.lcp || 0;
    performanceResults.webVitals.inp += evaluationResult.webVitals.inp || 0;
    performanceResults.webVitals.fid += evaluationResult.webVitals.fid || 0;
    performanceResults.webVitals.ttfb += evaluationResult.webVitals.ttfb || 0;

    performanceResults.reactProfiler.id +=
      evaluationResult.reactProfiler.actualDuration || 0;
    performanceResults.reactProfiler.phase +=
      evaluationResult.reactProfiler.phase || 0;
    performanceResults.reactProfiler.actualDuration +=
      evaluationResult.reactProfiler.actualDuration || 0;
    performanceResults.reactProfiler.baseDuration +=
      evaluationResult.reactProfiler.baseDuration || 0;
    performanceResults.reactProfiler.startTime +=
      evaluationResult.reactProfiler.startTime || 0;
    performanceResults.reactProfiler.commitTime +=
      evaluationResult.reactProfiler.commitTime || 0;

    performanceResults.error = evaluationResult.error;
  }

  await browser.close();

  return performanceResults;
}

function buildHtml(transpiled: string) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>React Performance Test</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/web-vitals@3.0.0/dist/web-vitals.iife.js"></script>
  <style>
    body { margin: 0; }
    #root { padding: 20px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    window.__RESULT__ = {
      renderTime: null,
      webVitals: {},
      reactProfiler: {},
      error: null
    };

    webVitals.onCLS((metric) => { window.__RESULT__.webVitals.cls = metric; });
    webVitals.onLCP((metric) => { window.__RESULT__.webVitals.lcp = metric; });
    webVitals.onINP((metric) => { window.__RESULT__.webVitals.inp = metric; });
    webVitals.onFID((metric) => { window.__RESULT__.webVitals.fid = metric; });
    webVitals.onTTFB((metric) => { window.__RESULT__.webVitals.ttfb = metric; });

    try {
      ${transpiled}

      window.App = App;

      // Render the component to the DOM with profiling
      const AppComponent = window.App || (() => React.createElement('div', null, 'No App component exported'));

      const root = ReactDOM.createRoot(document.getElementById('root'), {
        onUncaughtError: (error, errorInfo) => {
          window.__RESULT__.error = error;
        }
      });

      const renderStart = performance.now()

      root.render(
        React.createElement(React.Profiler, {
          id: 'App',
          onRender: (id, phase, actualDuration, baseDuration, startTime, commitTime) => {
            window.__RESULT__.reactProfiler.id = id;
            window.__RESULT__.reactProfiler.phase = phase;
            window.__RESULT__.reactProfiler.actualDuration = actualDuration;
            window.__RESULT__.reactProfiler.baseDuration = baseDuration;
            window.__RESULT__.reactProfiler.startTime = startTime;
            window.__RESULT__.reactProfiler.commitTime = commitTime;
          }
        }, React.createElement(AppComponent))
      );

      const renderEnd = performance.now();

      window.__RESULT__.renderTime = renderEnd - renderStart;
    } catch (error) {
      console.error('Error rendering component:', error);
      window.__RESULT__.error = error;
    }
  </script>
  <script>
    window.onerror = function(message, url, lineNumber) {
      const formattedMessage = message + '@' + lineNumber;
      if (window.__RESULT__.error && window.__RESULT__.error.message != null) {
        window.__RESULT__.error = window.__RESULT__.error + '\n\n' + formattedMessage;
      } else {
        window.__RESULT__.error = message + formattedMessage;
      }
    };
  </script>
</body>
</html>
`;

  return html;
}
