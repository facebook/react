import Vue, { VNode, VNodeDirective } from '../index';
import VueSSRClientPlugin = require('../../packages/vue-server-renderer/client-plugin');
import VueSSRServerPlugin = require('../../packages/vue-server-renderer/server-plugin');
import webpack = require('webpack');
import { readFileSync } from 'fs';
import { createRenderer, createBundleRenderer } from '../../packages/vue-server-renderer';

function createApp (context: any) {
  return new Vue({
    data: {
      url: context.url
    },
    template: `<div>The visited URL is: {{ url }}</div>`
  });
}

// Renderer test
const app = createApp({ url: 'http://localhost:8000/' });

const renderer = createRenderer({
  template: readFileSync('./index.template.html', 'utf-8')
});

const context = {
  title: 'Hello',
  meta: `
    <meta name="description" content="Vue.js SSR Example">
  `
};

renderer.renderToString(app, (err, html) => {
  if (err) throw err;
  const res: string = html;
});

renderer.renderToString(app, context, (err, html) => {
  if (err) throw err;
  const res: string = html;
});

renderer.renderToString(app)
  .then(html => {
    const res: string = html;
  })
  .catch(err => {
    throw err;
  });

renderer.renderToString(app, context)
  .then(html => {
    const res: string = html;
  })
  .catch(err => {
    throw err;
  });

renderer.renderToStream(app, context).on('data', chunk => {
  const html = chunk.toString();
});

// Bundle renderer test
declare const cacheClient: { [key: string]: string };

const bundleRenderer = createBundleRenderer('/path/to/vue-ssr-server-bundle.json', {
  inject: false,
  runInNewContext: 'once',
  basedir: '/path/to/base',

  shouldPreload: (file, type) => {
    if (type === 'script' || type === 'style') {
      return true;
    }
    if (type === 'font') {
      return /\.woff2$/.test(file);
    }
    if (type === 'image') {
      return file === 'hero.jpg';
    }
    return false;
  },

  cache: {
    get: key => {
      return cacheClient[key];
    },
    set: (key, val) => {
      cacheClient[key] = val;
    },
    has: key => {
      return !!cacheClient[key];
    }
  },

  directives: {
    example (vnode: VNode, directiveMeta: VNodeDirective) {
      // transform vnode based on directive binding metadata
    }
  }
});

bundleRenderer.renderToString(context, (err, html) => {
  if (err) throw err;
  const res: string = html;
});

bundleRenderer.renderToString().then(html => {
  const res: string = html;
});

bundleRenderer.renderToString(context).then(html => {
  const res: string = html;
});

bundleRenderer.renderToStream(context).on('data', chunk => {
  const html = chunk.toString();
});

// webpack plugins
webpack({
  plugins: [
    new VueSSRClientPlugin({
      filename: 'client-manifest.json'
    }),
    new VueSSRServerPlugin({
      filename: 'server-bundle.json'
    })
  ]
});
