import Store from 'src/devtools/store';

export function test(value) {
  return value instanceof Store;
}

export function print(value, serialize, indent) {
  return value.__toSnapshot();
}
