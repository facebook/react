/* @flow */

const path = require('path')
const serialize = require('serialize-javascript')

import { isJS, isCSS } from '../util'
import TemplateStream from './template-stream'
import { parseTemplate } from './parse-template'
import { createMapper } from './create-async-file-mapper'
import type { ParsedTemplate } from './parse-template'
import type { AsyncFileMapper } from './create-async-file-mapper'

type TemplateRendererOptions = {
  template: ?string;
  inject?: boolean;
  clientManifest?: ClientManifest;
  shouldPreload?: (file: string, type: string) => boolean;
  shouldPrefetch?: (file: string, type: string) => boolean;
};

export type ClientManifest = {
  publicPath: string;
  all: Array<string>;
  initial: Array<string>;
  async: Array<string>;
  modules: {
    [id: string]: Array<number>;
  },
  hasNoCssVersion?: {
    [file: string]: boolean;
  }
};

type Resource = {
  file: string;
  extension: string;
  fileWithoutQuery: string;
  asType: string;
};

export default class TemplateRenderer {
  options: TemplateRendererOptions;
  inject: boolean;
  parsedTemplate: ParsedTemplate | null;
  publicPath: string;
  clientManifest: ClientManifest;
  preloadFiles: Array<Resource>;
  prefetchFiles: Array<Resource>;
  mapFiles: AsyncFileMapper;

  constructor (options: TemplateRendererOptions) {
    this.options = options
    this.inject = options.inject !== false
    // if no template option is provided, the renderer is created
    // as a utility object for rendering assets like preload links and scripts.
    this.parsedTemplate = options.template
      ? parseTemplate(options.template)
      : null

    // extra functionality with client manifest
    if (options.clientManifest) {
      const clientManifest = this.clientManifest = options.clientManifest
      this.publicPath = clientManifest.publicPath.replace(/\/$/, '')
      // preload/prefetch directives
      this.preloadFiles = (clientManifest.initial || []).map(normalizeFile)
      this.prefetchFiles = (clientManifest.async || []).map(normalizeFile)
      // initial async chunk mapping
      this.mapFiles = createMapper(clientManifest)
    }
  }

  bindRenderFns (context: Object) {
    const renderer: any = this
    ;['ResourceHints', 'State', 'Scripts', 'Styles'].forEach(type => {
      context[`render${type}`] = renderer[`render${type}`].bind(renderer, context)
    })
    // also expose getPreloadFiles, useful for HTTP/2 push
    context.getPreloadFiles = renderer.getPreloadFiles.bind(renderer, context)
  }

  // render synchronously given rendered app content and render context
  renderSync (content: string, context: ?Object) {
    const template = this.parsedTemplate
    if (!template) {
      throw new Error('renderSync cannot be called without a template.')
    }
    context = context || {}
    if (this.inject) {
      return (
        template.head(context) +
        (context.head || '') +
        this.renderResourceHints(context) +
        this.renderStyles(context) +
        template.neck(context) +
        content +
        this.renderState(context) +
        this.renderScripts(context) +
        template.tail(context)
      )
    } else {
      return (
        template.head(context) +
        template.neck(context) +
        content +
        template.tail(context)
      )
    }
  }

  renderStyles (context: Object): string {
    const cssFiles = this.clientManifest
      ? this.clientManifest.all.filter(isCSS)
      : []
    return (
      // render links for css files
      (cssFiles.length
        ? cssFiles.map(file => `<link rel="stylesheet" href="${this.publicPath}/${file}">`).join('')
        : '') +
      // context.styles is a getter exposed by vue-style-loader which contains
      // the inline component styles collected during SSR
      (context.styles || '')
    )
  }

  renderResourceHints (context: Object): string {
    return this.renderPreloadLinks(context) + this.renderPrefetchLinks(context)
  }

  getPreloadFiles (context: Object): Array<Resource> {
    const usedAsyncFiles = this.getUsedAsyncFiles(context)
    if (this.preloadFiles || usedAsyncFiles) {
      return (this.preloadFiles || []).concat(usedAsyncFiles || [])
    } else {
      return []
    }
  }

  renderPreloadLinks (context: Object): string {
    const files = this.getPreloadFiles(context)
    const shouldPreload = this.options.shouldPreload
    if (files.length) {
      return files.map(({ file, extension, fileWithoutQuery, asType }) => {
        let extra = ''
        // by default, we only preload scripts or css
        if (!shouldPreload && asType !== 'script' && asType !== 'style') {
          return ''
        }
        // user wants to explicitly control what to preload
        if (shouldPreload && !shouldPreload(fileWithoutQuery, asType)) {
          return ''
        }
        if (asType === 'font') {
          extra = ` type="font/${extension}" crossorigin`
        }
        return `<link rel="preload" href="${
          this.publicPath}/${file
        }"${
          asType !== '' ? ` as="${asType}"` : ''
        }${
          extra
        }>`
      }).join('')
    } else {
      return ''
    }
  }

  renderPrefetchLinks (context: Object): string {
    const shouldPrefetch = this.options.shouldPrefetch
    if (this.prefetchFiles) {
      const usedAsyncFiles = this.getUsedAsyncFiles(context)
      const alreadyRendered = file => {
        return usedAsyncFiles && usedAsyncFiles.some(f => f.file === file)
      }
      return this.prefetchFiles.map(({ file, fileWithoutQuery, asType }) => {
        if (shouldPrefetch && !shouldPrefetch(fileWithoutQuery, asType)) {
          return ''
        }
        if (alreadyRendered(file)) {
          return ''
        }
        return `<link rel="prefetch" href="${this.publicPath}/${file}">`
      }).join('')
    } else {
      return ''
    }
  }

  renderState (context: Object, options?: Object): string {
    const {
      contextKey = 'state',
      windowKey = '__INITIAL_STATE__'
    } = options || {}
    const state = serialize(context[contextKey], { isJSON: true })
    const autoRemove = process.env.NODE_ENV === 'production'
      ? ';(function(){var s;(s=document.currentScript||document.scripts[document.scripts.length-1]).parentNode.removeChild(s);}());'
      : ''
    return context[contextKey]
      ? `<script>window.${windowKey}=${state}${autoRemove}</script>`
      : ''
  }

  renderScripts (context: Object): string {
    if (this.clientManifest) {
      const initial = this.preloadFiles
      const async = this.getUsedAsyncFiles(context)
      const needed = [initial[0]].concat(async || [], initial.slice(1))
      return needed.filter(({ file }) => isJS(file)).map(({ file }) => {
        return `<script src="${this.publicPath}/${file}" defer></script>`
      }).join('')
    } else {
      return ''
    }
  }

  getUsedAsyncFiles (context: Object): ?Array<Resource> {
    if (!context._mappedFiles && context._registeredComponents && this.mapFiles) {
      const registered = Array.from(context._registeredComponents)
      context._mappedFiles = this.mapFiles(registered).map(normalizeFile)
    }
    return context._mappedFiles
  }

  // create a transform stream
  createStream (context: ?Object): TemplateStream {
    if (!this.parsedTemplate) {
      throw new Error('createStream cannot be called without a template.')
    }
    return new TemplateStream(this, this.parsedTemplate, context || {})
  }
}

function normalizeFile (file: string): Resource {
  const withoutQuery = file.replace(/\?.*/, '')
  const extension = path.extname(withoutQuery).slice(1)
  return {
    file,
    extension,
    fileWithoutQuery: withoutQuery,
    asType: getPreloadType(extension)
  }
}

function getPreloadType (ext: string): string {
  if (ext === 'js') {
    return 'script'
  } else if (ext === 'css') {
    return 'style'
  } else if (/jpe?g|png|svg|gif|webp|ico/.test(ext)) {
    return 'image'
  } else if (/woff2?|ttf|otf|eot/.test(ext)) {
    return 'font'
  } else {
    // not exhausting all possibilities here, but above covers common cases
    return ''
  }
}
