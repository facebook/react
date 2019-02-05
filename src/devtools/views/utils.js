// @flow

import { meta } from '../../hydration';

export function getMetaValueLabel(data: Object): string | null {
  switch (data[meta.type]) {
    case 'react_element':
      return `<${data[meta.name]} />`;
    case 'function':
      return `${data[meta.name] || 'fn'}()`;
    case 'object':
      return 'Object';
    case 'date':
    case 'symbol':
      return data[meta.name];
    case 'iterator':
      return `${data[meta.name]}(…)`;
    case 'array_buffer':
    case 'data_view':
    case 'array':
    case 'typed_array':
      return `${data[meta.name]}[${data[meta.meta].length}]`;
    default:
      return null;
  }
}
