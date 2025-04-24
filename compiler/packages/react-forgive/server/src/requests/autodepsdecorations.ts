import {type AutoDepsDecorationsEvent} from 'babel-plugin-react-compiler/src/Entrypoint';
import {type Position} from 'vscode-languageserver-textdocument';
import {RequestType} from 'vscode-languageserver/node';
import {type Range, sourceLocationToRange} from '../utils/range';

export type AutoDepsDecorationsLSPEvent = {
  useEffectCallExpr: Range;
  decorations: Array<Range>;
};
export interface AutoDepsDecorationsParams {
  position: Position;
}
export namespace AutoDepsDecorationsRequest {
  export const type = new RequestType<
    AutoDepsDecorationsParams,
    Array<Range> | null,
    void
  >('react/autodeps_decorations');
}

export function mapCompilerEventToLSPEvent(
  event: AutoDepsDecorationsEvent,
): AutoDepsDecorationsLSPEvent {
  return {
    useEffectCallExpr: sourceLocationToRange(event.useEffectCallExpr),
    decorations: event.decorations.map(sourceLocationToRange),
  };
}
