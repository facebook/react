/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import clsx from "clsx";

import { HIR } from "babel-plugin-react-forget";
import { useState } from "react";
import generate from "@babel/generator";
import prettier from "prettier";
import prettierParserBabel from "prettier/parser-babel";

const {
  parseFunctions,
  Environment,
  enterSSA,
  eliminateRedundantPhi,
  inferReferenceEffects,
  inferMutableRanges,
  leaveSSA,
  lower,
  printHIR,
  codegen,
} = HIR;

export default function HIRTabContent({ source }: { source: string }) {
  const astFunctions = parseFunctions(source);

  const [flags, setFlags] = useState({
    codegen: true,
    eliminateRedundantPhi: true,
    inferReferenceEffects: true,
    inferMutableRanges: true,
    leaveSSA: true,
  });

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1">
        {astFunctions.map((func, index): React.ReactNode => {
          let body;
          try {
            const env = new Environment();
            const ir = lower(func, env);
            enterSSA(ir, env);
            if (flags.eliminateRedundantPhi) {
              eliminateRedundantPhi(ir);
            }
            if (flags.inferReferenceEffects) {
              inferReferenceEffects(ir);
            }
            if (flags.inferMutableRanges) {
              inferMutableRanges(ir);
            }
            if (flags.leaveSSA) {
              leaveSSA(ir);
            }

            if (flags.codegen) {
              const ast = codegen(ir);
              // TODO: codegen should set this correctly directly
              ast.loc = func.node.loc;
              const generated = generate(
                ast,
                {
                  sourceMaps: true,
                  sourceFileName: "input.js",
                },
                source
              );
              const formatted = prettier.format(generated.code, {
                semi: true,
                parser: "babel",
                plugins: [prettierParserBabel],
              });
              const sourceMapUrl = getSourceMapUrl(
                generated.code,
                JSON.stringify(generated.map)
              );
              body = (
                <>
                  <pre>{formatted}</pre>
                  {sourceMapUrl && (
                    <iframe
                      src={sourceMapUrl}
                      className="w-full h-96"
                      title="Generated Code"
                    />
                  )}
                </>
              );
            } else {
              body = <pre>{printHIR(ir.body)}</pre>;
            }
          } catch (e: any) {
            body = <div>error: ${e.toString()}</div>;
          }
          const name = func.node.id?.name ?? "anonymous";
          return (
            <div key={index} className="border-b py-4 px-2">
              <h3 className="font-medium mb-2">Function: {name}</h3>
              {body}
            </div>
          );
        })}
      </div>
      <CompilerFlagsEditor flags={flags} setFlags={setFlags} />
    </div>
  );
}

function utf16ToUTF8(s: string): string {
  return unescape(encodeURIComponent(s));
}

function getSourceMapUrl(code: string, map: string): string | null {
  code = utf16ToUTF8(code);
  map = utf16ToUTF8(map);
  return `https://evanw.github.io/source-map-visualization/#${btoa(
    `${code.length}\0${code}${map.length}\0${map}`
  )}`;
}

type Flags = {
  eliminateRedundantPhi: boolean;
  inferReferenceEffects: boolean;
  inferMutableRanges: boolean;
  leaveSSA: boolean;
  codegen: boolean;
};

function CompilerFlagsEditor({
  flags,
  setFlags,
}: {
  flags: Flags;
  setFlags: (flags: Flags) => void;
}) {
  return (
    <div className="flex flex-col gap-2 px-5 py-4 border-t border-gray-200">
      <h3 className="font-medium">Compiler Options</h3>
      <div className="flex flex-col">
        <LabeledCheckbox
          label="Eliminate Redundant Phi"
          value={flags.eliminateRedundantPhi}
          onChange={(eliminateRedundantPhi) => {
            setFlags({ ...flags, eliminateRedundantPhi });
          }}
        />
        <LabeledCheckbox
          label="Infer Reference Effects"
          value={flags.inferReferenceEffects}
          onChange={(inferReferenceEffects) => {
            setFlags({ ...flags, inferReferenceEffects });
          }}
        />
        <LabeledCheckbox
          label="Infer Mutable Ranges"
          value={flags.inferMutableRanges}
          onChange={(inferMutableRanges) => {
            setFlags({ ...flags, inferMutableRanges });
          }}
        />
        <LabeledCheckbox
          label="Leave SSA"
          value={flags.leaveSSA}
          onChange={(leaveSSA) => {
            setFlags({ ...flags, leaveSSA });
          }}
        />
        <LabeledCheckbox
          label="Codegen"
          value={flags.codegen}
          onChange={(codegen) => {
            setFlags({ ...flags, codegen });
          }}
        />
      </div>
    </div>
  );
}

function LabeledCheckbox({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex gap-1.5 text-base">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => {
          onChange(e.target.checked);
        }}
      />
      <span className={clsx({ "text-gray-500": !value, "text-black": value })}>
        {label}
      </span>
    </label>
  );
}
