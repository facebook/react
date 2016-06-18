import {Url} from '../../url_parser';

export class MatchedUrl {
  constructor(
      public urlPath: string, public urlParams: string[], public allParams: {[key: string]: any},
      public auxiliary: Url[], public rest: Url) {}
}


export class GeneratedUrl {
  constructor(public urlPath: string, public urlParams: {[key: string]: any}) {}
}

export interface RoutePath {
  specificity: string;
  terminal: boolean;
  hash: string;
  matchUrl(url: Url): MatchedUrl;
  generateUrl(params: {[key: string]: any}): GeneratedUrl;
  toString(): string;
}
