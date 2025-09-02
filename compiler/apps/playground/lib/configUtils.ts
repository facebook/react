/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import parserBabel from 'prettier/plugins/babel';
import prettierPluginEstree from 'prettier/plugins/estree';
import * as prettier from 'prettier/standalone';
import {parseConfigPragmaAsString} from '../../../packages/babel-plugin-react-compiler/src/Utils/TestUtils';

/**
 * Parse config from pragma and format it with prettier
 */
export async function parseAndFormatConfig(source: string): Promise<string> {
  const pragma = source.substring(0, source.indexOf('\n'));
  let configString = parseConfigPragmaAsString(pragma);
  if (configString !== '') {
    configString = `(${configString})`;
  }

  try {
    const formatted = await prettier.format(configString, {
      semi: true,
      parser: 'babel-ts',
      plugins: [parserBabel, prettierPluginEstree],
    });
    return formatted;
  } catch (error) {
    console.error('Error formatting config:', error);
    return ''; // Return empty string if not valid for now
  }
}

function extractCurlyBracesContent(input: string): string {
  const startIndex = input.indexOf('{');
  const endIndex = input.lastIndexOf('}');
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error('No outer curly braces found in input');
  }
  return input.slice(startIndex, endIndex + 1);
}

function cleanContent(content: string): string {
  return content
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate a the override pragma comment from a formatted config object string
 */
export async function generateOverridePragmaFromConfig(
  formattedConfigString: string,
): Promise<string> {
  const content = extractCurlyBracesContent(formattedConfigString);
  const cleanConfig = cleanContent(content);

  // Format the config to ensure it's valid
  await prettier.format(`(${cleanConfig})`, {
    semi: false,
    parser: 'babel-ts',
    plugins: [parserBabel, prettierPluginEstree],
  });

  return `// @OVERRIDE:${cleanConfig}`;
}

/**
 * Update the override pragma comment in source code.
 */
export function updateSourceWithOverridePragma(
  source: string,
  newPragma: string,
): string {
  const firstLineEnd = source.indexOf('\n');
  const firstLine = source.substring(0, firstLineEnd);

  const pragmaRegex = /^\/\/\s*@/;
  if (firstLineEnd !== -1 && pragmaRegex.test(firstLine.trim())) {
    return newPragma + source.substring(firstLineEnd);
  } else {
    return newPragma + '\n' + source;
  }
}
