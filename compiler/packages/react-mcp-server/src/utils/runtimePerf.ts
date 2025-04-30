import * as babel from '@babel/core';
import puppeteer from 'puppeteer';

export async function measurePerformance(code: string) {
  const babelOptions = {
    configFile: false,
    babelrc: false,
    presets: [
      require.resolve('@babel/preset-env'),
      require.resolve('@babel/preset-react'),
    ],
  };

  // Parse the code to AST
  const parsed = await babel.parseAsync(code, babelOptions);
  if (!parsed) {
    throw new Error('Failed to parse code');
  }

  // Transform AST to browser-compatible JavaScript
  const transformResult = await babel.transformFromAstAsync(parsed, undefined, {
    ...babelOptions,
    filename: 'file.jsx',
    plugins: [
      () => ({
        visitor: {
          ImportDeclaration(path: babel.NodePath<babel.types.ImportDeclaration>) {
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
  await page.setContent(html, {waitUntil: 'networkidle0'});

  await page.waitForFunction(
    'window.__RESULT__ !== undefined && (window.__RESULT__.renderTime !== null || window.__RESULT__.error !== null)',
  );

  const result = await page.evaluate(() => {
    return (window as any).__RESULT__;
  });

  await browser.close();
  return result;
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
                    reactProfilerMetrics: {},
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
                                window.__RESULT__.reactProfilerMetrics.id = id;
                                window.__RESULT__.reactProfilerMetrics.phase = phase;
                                window.__RESULT__.reactProfilerMetrics.actualDuration = actualDuration;
                                window.__RESULT__.reactProfilerMetrics.baseDuration = baseDuration;
                                window.__RESULT__.reactProfilerMetrics.startTime = startTime;
                                window.__RESULT__.reactProfilerMetrics.commitTime = commitTime;
                            }
                        }, React.createElement(AppComponent))
                    );

                    const renderEnd = performance.now();

                    window.__RESULT__.renderTime = renderEnd - renderStart;
                } catch (error) {
                    console.error('Error rendering component:', error);
                    window.__RESULT__.error = {
                        message: error.message,
                        stack: error.stack
                    };
                }
            </script>
            <script>
                window.onerror = function(message, url, lineNumber) {
                    window.__RESULT__.error = message;
                };
            </script>
        </body>
        </html>
    `;

  return html;
}
