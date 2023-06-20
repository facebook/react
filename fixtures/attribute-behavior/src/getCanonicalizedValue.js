function getCanonicalizedValue(value) {
  switch (typeof value) {
    case 'undefined':
      return '<undefined>';
    case 'object':
      if (value === null) {
        return '<null>';
      }
      if ('baseVal' in value) {
        return getCanonicalizedValue(value.baseVal);
      }
      if (value instanceof SVGLength) {
        return '<SVGLength: ' + value.valueAsString + '>';
      }
      if (value instanceof SVGRect) {
        return (
          '<SVGRect: ' +
          [value.x, value.y, value.width, value.height].join(',') +
          '>'
        );
      }
      if (value instanceof SVGPreserveAspectRatio) {
        return (
          '<SVGPreserveAspectRatio: ' +
          value.align +
          '/' +
          value.meetOrSlice +
          '>'
        );
      }
      if (value instanceof SVGNumber) {
        return value.value;
      }
      if (value instanceof SVGMatrix) {
        return (
          '<SVGMatrix ' +
          value.a +
          ' ' +
          value.b +
          ' ' +
          value.c +
          ' ' +
          value.d +
          ' ' +
          value.e +
          ' ' +
          value.f +
          '>'
        );
      }
      if (value instanceof SVGTransform) {
        return (
          getCanonicalizedValue(value.matrix) +
          '/' +
          value.type +
          '/' +
          value.angle
        );
      }
      if (typeof value.length === 'number') {
        return (
          '[' +
          Array.from(value)
            .map(v => getCanonicalizedValue(v))
            .join(', ') +
          ']'
        );
      }
      let name = (value.constructor && value.constructor.name) || 'object';
      return '<' + name + '>';
    case 'function':
      return '<function>';
    case 'symbol':
      return '<symbol>';
    case 'number':
      return `<number: ${value}>`;
    case 'string':
      if (value === '') {
        return '<empty string>';
      }
      return '"' + value + '"';
    case 'boolean':
      return `<boolean: ${value}>`;
    default:
      throw new Error('Switch statement should be exhaustive.');
  }
}

export default getCanonicalizedValue;
