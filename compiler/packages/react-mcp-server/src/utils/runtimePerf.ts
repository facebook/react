import * as babel from '@babel/core';
import * as parser from '@babel/parser';
import puppeteer from 'puppeteer';

export async function measurePerformance(code: any) {
    // Parse the code into an AST
    const parsed = await parseAsync(code);

    // Transform the AST into browser-compatible JavaScript
    const transpiled = await transformAsync(parsed, code);

    console.log(transpiled);

    // Launch puppeteer with increased protocol timeout
    const browser = await puppeteer.launch({
        protocolTimeout: 600_000, // Increase timeout to 10 minutes
        headless: false
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    const html = buildHtml(transpiled);
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.__RESULT__ !== undefined', {timeout: 600_000}); // 10 minute timeout

    const result = await page.evaluate(() => {
        return (window as any).__RESULT__;
    });
    // await browser.close();
    return result;
}

/**
 * Parse code string into an AST
 * @param {string} code - The source code to parse
 * @returns {babel.types.File} - The parsed AST
 */
function parseAsync(code: string) {
    return parser.parse(code, {
        sourceType: 'module',
        plugins: [
            'jsx',
            'typescript',
            'classProperties',
            'optionalChaining',
            'nullishCoalescingOperator',
        ],
    });
}

/**
 * Transform AST into browser-compatible JavaScript
 * @param {babel.types.File} ast - The AST to transform
 * @param {Object} opts - Transformation options
 * @returns {Promise<string>} - The transpiled code
 */
async function transformAsync(ast: babel.types.Node, code: string) {
    // Provide a dummy filename to satisfy Babel's requirement for filename context
    const result = await babel.transformFromAstAsync(ast, null,  {
        filename: 'file.jsx',
        presets: [
          ['@babel/preset-env'],
          '@babel/preset-react'
        ],
        plugins: [
            () => ({
                visitor: {
                  ImportDeclaration(path) {
                    const value = path.node.source.value;
                    if (value === 'react' || value === 'react-dom') {
                      path.remove();
                    }
                  }
                }
              })
        ]
    });

    return result?.code || '';
}

function buildHtml(transpiled: string | null | undefined) {
    // Create HTML that includes React, ReactDOM, and the transpiled code
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
                body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; }
                #root { padding: 20px; }
            </style>
        </head>
        <body>
            <div id="root"></div>
            <script type="module">
                // Store performance metrics
                window.__RESULT__ = {
                    renderTime: null,
                    webVitals: {}
                };

                // Measure web vitals
                webVitals.onCLS((metric) => { window.__RESULT__.webVitals.cls = metric; });
                webVitals.onLCP((metric) => { window.__RESULT__.webVitals.lcp = metric; });
                webVitals.onINP((metric) => { window.__RESULT__.webVitals.inp = metric; });
                webVitals.onFID((metric) => { window.__RESULT__.webVitals.fid = metric; });
                webVitals.onTTFB((metric) => { window.__RESULT__.webVitals.ttfb = metric; });

                // Wrap user code in React.Profiler to measure render performance
                const renderStart = performance.now();

                // Execute the transpiled code
                ${transpiled}

                // Render the component to the DOM with profiling
                const AppComponent = window.App || (() => React.createElement('div', null, 'No App component exported'));
                const root = ReactDOM.createRoot(document.getElementById('root'));

                console.log('rendering...');
                root.render(
                    React.createElement(React.Profiler, {
                        id: 'App',
                        onRender: (id, phase, actualDuration) => {
                            window.__RESULT__.renderTime = actualDuration;
                        }
                    }, React.createElement(AppComponent))
                );
            </script>
        </body>
        </html>
    `;

    return html;
}
