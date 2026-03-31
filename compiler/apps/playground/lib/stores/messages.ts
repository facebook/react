/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export enum MessageSource {
  Babel = 'Babel',
  Forget = 'Forget',
  Playground = 'Playground',
}

export enum MessageLevel {
  Info = 'info',
  Warning = 'warning',
  Error = 'error',
}

export interface Message {
  readonly title: string;
  readonly level: MessageLevel;
  readonly source: MessageSource; // Can be used to further style messages differently.
  readonly codeframe?: string;
}

export function createMessage(
  message: string,
  level: MessageLevel,
  source: MessageSource,
): Message {
  const normalized = message.replace(/\r\n/g, '\n').trimEnd();
  const [titleRaw, ...body] = normalized.split('\n');
  const title = titleRaw.trim();
  const codeframeRaw = body.join('\n').trim();
  const codeframe = codeframeRaw === '' ? undefined : codeframeRaw;

  return {
    source,
    level,
    title,
    codeframe,
  };
}
