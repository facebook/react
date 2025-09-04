/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import parserBabel from 'prettier/plugins/babel';
import prettierPluginEstree from 'prettier/plugins/estree';
import * as prettier from 'prettier/standalone';
import {parsePluginOptions} from 'babel-plugin-react-compiler';
import {parseConfigPragmaAsString} from '../../../packages/babel-plugin-react-compiler/src/Utils/TestUtils';

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}
/**
 * Parse config from pragma and format it with prettier
 */
export async function parseAndFormatConfig(source: string): Promise<string> {
  const pragma = source.substring(0, source.indexOf('\n'));
  let configString = parseConfigPragmaAsString(pragma);
  if (configString !== '') {
    configString = `\
    import type { PluginOptions } from 'babel-plugin-react-compiler/dist';

    (${configString} satisfies Partial<PluginOptions>)`;
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
  const startIndex = input.indexOf('({') + 1;
  const endIndex = input.lastIndexOf('}');
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error('No outer curly braces found in input.');
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
 * Validate that a config string can be parsed as a valid PluginOptions object
 * Throws an error if validation fails.
 */
function validateConfigAsPluginOptions(configString: string): void {
  // Validate that config can be parse as JS obj
  let parsedConfig: unknown;
  try {
    parsedConfig = new Function(`return (${configString})`)();
  } catch (_) {
    throw new ConfigError('Config has invalid syntax.');
  }

  // Validate against PluginOptions schema
  try {
    parsePluginOptions(parsedConfig);
  } catch (_) {
    throw new ConfigError('Config does not match the expected schema.');
  }
}

/**
 * Generate a the override pragma comment from a formatted config object string
 */
export async function generateOverridePragmaFromConfig(
  formattedConfigString: string,
): Promise<string> {
  const content = extractCurlyBracesContent(formattedConfigString);
  const cleanConfig = cleanContent(content);

  validateConfigAsPluginOptions(cleanConfig);

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
