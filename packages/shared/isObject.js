function isObject(o: mixed): boolean {
  return typeof o === 'object' && o !== null;
}

export default isObject;
