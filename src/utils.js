// @flow

export function utfDecodeString(array: Uint8Array): string {
  let string = '';
  const { length } = array;
  for (let i = 0; i < length; i++) {
    string += String.fromCharCode(array[i]);
  }
  return string;
}

export function utfEncodeString(string: string): Uint8Array {
  const array = new Uint8Array(string.length);
  const { length } = string;
  for (let i = 0; i < length; i++) {
    array[i] = string.charCodeAt(i);
  }
  return array;
}
