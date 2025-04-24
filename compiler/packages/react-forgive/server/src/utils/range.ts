import * as t from '@babel/types';
import {type Position} from 'vscode-languageserver/node';

export type Range = [Position, Position];
export function isPositionWithinRange(
  position: Position,
  [start, end]: Range,
): boolean {
  return position.line >= start.line && position.line <= end.line;
}

export function sourceLocationToRange(
  loc: t.SourceLocation,
): [Position, Position] {
  return [
    {line: loc.start.line - 1, character: loc.start.column},
    {line: loc.end.line - 1, character: loc.end.column},
  ];
}
