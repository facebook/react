import * as ts from "typescript";
export default function (options?: {
    refreshReg?: string;
    refreshSig?: string;
    emitFullSignatures?: boolean;
    ts?: typeof ts;
}): ts.TransformerFactory<ts.SourceFile>;
