import * as ts from "typescript";
export default function (options?: {
    refreshReg?: string;
    refreshSig?: string;
    emitFullSignatures?: boolean;
    ts?: ts;
}): ts.TransformerFactory<ts.SourceFile>;
