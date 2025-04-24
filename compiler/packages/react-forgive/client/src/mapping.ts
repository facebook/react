import * as vscode from 'vscode';
import {Position} from 'vscode-languageclient/node';

export function positionLiteralToVSCodePosition(
  position: Position,
): vscode.Position {
  return new vscode.Position(position.line, position.character);
}

export function positionsToRange(start: Position, end: Position): vscode.Range {
  return new vscode.Range(
    positionLiteralToVSCodePosition(start),
    positionLiteralToVSCodePosition(end),
  );
}
