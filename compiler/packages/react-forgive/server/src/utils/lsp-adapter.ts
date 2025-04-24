import * as t from '@babel/types';
import {Position} from 'vscode-languageserver/node';

export function sourceLocationToRange(
  loc: t.SourceLocation,
): [Position, Position] {
  return [
    {line: loc.start.line - 1, character: loc.start.column},
    {line: loc.end.line - 1, character: loc.end.column},
  ];
}
