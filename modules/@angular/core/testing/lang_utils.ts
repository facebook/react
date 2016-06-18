export function getTypeOf(instance: any /** TODO #9100 */) {
  return instance.constructor;
}

export function instantiateType(type: Function, params: any[] = []) {
  var instance = Object.create(type.prototype);
  instance.constructor.apply(instance, params);
  return instance;
}
