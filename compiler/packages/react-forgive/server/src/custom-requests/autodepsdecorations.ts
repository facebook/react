import {AutoDepsDecorations} from 'babel-plugin-react-compiler/src/Entrypoint';
import {Position} from 'vscode-languageserver-textdocument';
import {sourceLocationToRange} from '../utils/lsp-adapter';

export type Range = [Position, Position];
export type AutoDepsDecorationsLSPEvent = {
  useEffectCallExpr: Range;
  decorations: Array<Range>;
};

export function mapCompilerEventToLSPEvent(
  event: AutoDepsDecorations,
): AutoDepsDecorationsLSPEvent {
  return {
    useEffectCallExpr: sourceLocationToRange(event.useEffectCallExpr),
    decorations: event.decorations.map(sourceLocationToRange),
  };
}
