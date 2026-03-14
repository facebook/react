import { parse } from "@babel/parser";
import fs from "fs";
import path from "path";
import fg from "fast-glob";
const { globSync } = fg;

const FIXTURE_DIR = path.resolve(
  "compiler/packages/babel-plugin-react-compiler/src/__tests__/fixtures"
);
const OUTPUT_DIR = process.argv[2]; // temp dir passed as argument

if (!OUTPUT_DIR) {
  console.error("Usage: node babel-ast-to-json.mjs <output-dir>");
  process.exit(1);
}

// Find all fixture source files
const fixtures = globSync("**/*.{js,ts,tsx,jsx}", { cwd: FIXTURE_DIR });

let parsed = 0;
let errors = 0;

for (const fixture of fixtures) {
  const input = fs.readFileSync(path.join(FIXTURE_DIR, fixture), "utf8");
  const isFlow = input.includes("@flow");

  const plugins = isFlow ? ["flow", "jsx"] : ["typescript", "jsx"];
  // Default to module unless there's an indicator it should be script
  const sourceType = "module";

  try {
    const ast = parse(input, {
      sourceFilename: fixture,
      plugins,
      sourceType,
      allowReturnOutsideFunction: true,
      errorRecovery: true,
    });

    const json = JSON.stringify(ast, null, 2);

    const outPath = path.join(OUTPUT_DIR, fixture + ".json");
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, json);
    parsed++;
  } catch (e) {
    // Parse errors are expected for some fixtures
    const outPath = path.join(OUTPUT_DIR, fixture + ".parse-error");
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, e.message);
    errors++;
  }
}

console.log(
  `Parsed ${parsed} fixtures, ${errors} parse errors, ${fixtures.length} total`
);
