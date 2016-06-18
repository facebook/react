declare module "B64" {
  export function fromByteArray(arr: Uint8Array): string;
  export function toByteArray(str: string): Uint8Array;
}