import {SourceLocation} from 'babel-plugin-react-compiler/src';
import {type Range} from 'vscode-languageserver';

export function babelLocationToRange(loc: SourceLocation): Range | null {
  if (typeof loc === 'symbol') {
    return null;
  }
  return {
    start: {line: loc.start.line - 1, character: loc.start.column},
    end: {line: loc.end.line - 1, character: loc.end.column},
  };
}

/**
 * Refine range to only the first character.
 */
export function getRangeFirstCharacter(range: Range): Range {
  return {
    start: range.start,
    end: range.start,
  };
}
