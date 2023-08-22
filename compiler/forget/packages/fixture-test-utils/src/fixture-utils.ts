import fs from "fs/promises";
import glob from "glob";
import invariant from "invariant";
import path from "path";
import { FILTER_PATH, FIXTURES_PATH } from "./constants";

export type TestFilter =
  | {
      kind: "only";
      paths: Array<string>;
    }
  | {
      kind: "skip";
      paths: Array<string>;
    };

async function exists(file: string): Promise<boolean> {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

export async function readTestFilter(): Promise<TestFilter | null> {
  if (!(await exists(FILTER_PATH))) {
    throw new Error(`testfilter file not found at ${FILTER_PATH}`);
  }

  const input = await fs.readFile(FILTER_PATH, "utf8");
  const lines = input.trim().split("\n");
  if (lines.length < 2) {
    console.warn("Misformed filter file. Expected at least two lines.");
    return null;
  }

  let filter: "only" | "skip" | null = null;
  if (lines[0]!.indexOf("@only") !== -1) {
    filter = "only";
  }
  if (lines[0]!.indexOf("@skip") !== -1) {
    filter = "skip";
  }
  if (filter === null) {
    console.warn(
      "Misformed filter file. Expected first line to contain @only or @skip"
    );
    return null;
  }
  lines.shift();
  return {
    kind: filter,
    paths: lines,
  };
}

export type TestFixture = {
  basename: string;
  inputPath: string;
  inputExists: boolean;
  outputPath: string;
  outputExists: boolean;
};

export function getFixtures(
  filter: TestFilter | null
): Map<string, TestFixture> {
  // search for fixtures within nested directories
  const files = glob.sync(`**/*.{js,ts,tsx,md}`, {
    cwd: FIXTURES_PATH,
  });
  const fixtures: Map<string, TestFixture> = new Map();

  for (const filePath of files) {
    const basename = path.basename(
      path.basename(
        path.basename(path.basename(filePath, ".js"), ".ts"),
        ".tsx"
      ),
      ".expect.md"
    );
    // "partial" paths do not include suffixes
    const partialRelativePath = path.join(path.dirname(filePath), basename);
    // Replicate jest test behavior
    if (basename.startsWith("todo.")) {
      continue;
    }
    if (filter) {
      if (
        filter.kind === "only" &&
        filter.paths.indexOf(partialRelativePath) === -1
      ) {
        continue;
      } else if (
        filter.kind === "skip" &&
        filter.paths.indexOf(partialRelativePath) !== -1
      ) {
        continue;
      }
    }

    let fixtureInfo = fixtures.get(partialRelativePath);
    if (fixtureInfo === undefined) {
      const partialAbsolutePath = path.join(FIXTURES_PATH, partialRelativePath);
      fixtureInfo = {
        basename,
        inputPath: `${partialAbsolutePath}.js`,
        inputExists: false,
        outputPath: `${partialAbsolutePath}.expect.md`,
        outputExists: false,
      };
      fixtures.set(partialRelativePath, fixtureInfo);
    }

    if (
      filePath.endsWith(".js") ||
      filePath.endsWith(".ts") ||
      filePath.endsWith(".tsx")
    ) {
      // inputPath may have a different file extension than the .js default
      fixtureInfo.inputPath = path.join(FIXTURES_PATH, filePath);
      fixtureInfo.inputExists = true;
    } else {
      fixtureInfo.outputExists = true;
    }
  }

  return fixtures;
}

function wrapWithTripleBackticks(s: string, ext: string | null = null): string {
  return `\`\`\`${ext ?? ""}
${s}
\`\`\``;
}

export function writeOutputToString(
  input: string,
  output: string | null,
  error: Error | null
) {
  // leading newline intentional
  let result = `
## Input

${wrapWithTripleBackticks(input, "javascript")}
`; // trailing newline + space internional

  if (output != null) {
    result += `
## Code

${output == null ? "[ none ]" : wrapWithTripleBackticks(output, "javascript")}
`;
  } else {
    result += "\n";
  }

  if (error != null) {
    const errorMessage = error.message.replace(/^\/.*?:\s/, "");

    result += `
## Error

${wrapWithTripleBackticks(errorMessage)}
          \n`;
  }
  return result + `      `;
}
