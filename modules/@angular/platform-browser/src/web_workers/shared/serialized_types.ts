// This file contains interface versions of browser types that can be serialized to Plain Old
// JavaScript Objects
export class LocationType {
  constructor(
      public href: string, public protocol: string, public host: string, public hostname: string,
      public port: string, public pathname: string, public search: string, public hash: string,
      public origin: string) {}
}
