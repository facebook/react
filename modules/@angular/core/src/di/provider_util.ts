import {Provider} from './provider';

export function isProviderLiteral(obj: any): boolean {
  return obj && typeof obj == 'object' && obj.provide;
}

export function createProvider(obj: any): Provider {
  return new Provider(obj.provide, obj);
}
