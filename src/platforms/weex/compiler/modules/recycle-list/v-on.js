/* @flow */

const inlineStatementRE = /^\s*([A-Za-z_$0-9\['\."\]]+)*\s*\(\s*(([A-Za-z_$0-9\['\."\]]+)?(\s*,\s*([A-Za-z_$0-9\['\."\]]+))*)\s*\)$/

function parseHandlerParams (handler: ASTElementHandler) {
  const res = inlineStatementRE.exec(handler.value)
  if (res && res[2]) {
    handler.params = res[2].split(/\s*,\s*/)
  }
}

export function postTransformVOn (el: ASTElement, options: WeexCompilerOptions) {
  const events: ASTElementHandlers | void = el.events
  if (!events) {
    return
  }
  for (const name in events) {
    const handler: ASTElementHandler | Array<ASTElementHandler> = events[name]
    if (Array.isArray(handler)) {
      handler.map(fn => parseHandlerParams(fn))
    } else {
      parseHandlerParams(handler)
    }
  }
}
