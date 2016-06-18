
export function stringify(obj: any): string {
  if (typeof obj == 'function') return obj.name || obj.toString();
  return '' + obj;
}


export function onError(e: any) {
  // TODO: (misko): We seem to not have a stack trace here!
  console.log(e, e.stack);
  throw e;
}

export function controllerKey(name: string): string {
  return '$' + name + 'Controller';
}
