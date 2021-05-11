/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

export enum MessageSource {
  Babel,
  Rollup,
  Forget,
  Playground,
}

export enum MessageLevel {
  Info,
  Warning,
  Error,
}

export interface Message {
  title: string;
  level: MessageLevel;
  source: MessageSource; // Can be used to further style messages differently.
  codeframe: string | undefined;
}

export function createMessage(
  message: string,
  level: MessageLevel,
  source: MessageSource
): Message {
  const [title, ...body] = message.split("\n");
  const codeframe = body.length > 0 ? body.join("\n") : undefined;

  return {
    source,
    level,
    title,
    codeframe,
  };
}
