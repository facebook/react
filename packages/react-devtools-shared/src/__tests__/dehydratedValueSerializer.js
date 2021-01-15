import {meta} from 'react-devtools-shared/src/hydration';

// test() is part of Jest's serializer API
export function test(maybeDehydratedValue) {
  return (
    maybeDehydratedValue !== null &&
    typeof maybeDehydratedValue === 'object' &&
    maybeDehydratedValue.hasOwnProperty(meta.inspectable) &&
    maybeDehydratedValue[meta.inspected] !== true
  );
}

// print() is part of Jest's serializer API
export function print(dehydratedValue, serialize, indent) {
  const indentation = Math.max(indent('.').indexOf('.') - 2, 0);
  const paddingLeft = ' '.repeat(indentation);
  return (
    'Dehydrated {\n' +
    paddingLeft +
    '  "preview_short": ' +
    dehydratedValue[meta.preview_short] +
    ',\n' +
    paddingLeft +
    '  "preview_long": ' +
    dehydratedValue[meta.preview_long] +
    ',\n' +
    paddingLeft +
    '}'
  );
}
