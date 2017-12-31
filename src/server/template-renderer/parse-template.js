/* @flow */

const compile = require('lodash.template')
const compileOptions = {
  escape: /{{([^{][\s\S]+?[^}])}}/g,
  interpolate: /{{{([\s\S]+?)}}}/g
}

export type ParsedTemplate = {
  head: (data: any) => string;
  neck: (data: any) => string;
  tail: (data: any) => string;
};

export function parseTemplate (
  template: string,
  contentPlaceholder?: string = '<!--vue-ssr-outlet-->'
): ParsedTemplate {
  if (typeof template === 'object') {
    return template
  }

  let i = template.indexOf('</head>')
  const j = template.indexOf(contentPlaceholder)

  if (j < 0) {
    throw new Error(`Content placeholder not found in template.`)
  }

  if (i < 0) {
    i = template.indexOf('<body>')
    if (i < 0) {
      i = j
    }
  }

  return {
    head: compile(template.slice(0, i), compileOptions),
    neck: compile(template.slice(i, j), compileOptions),
    tail: compile(template.slice(j + contentPlaceholder.length), compileOptions)
  }
}
