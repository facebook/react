import {escape, isPresent} from '../facade/lang';


/**
 * A message extracted from a template.
 *
 * The identity of a message is comprised of `content` and `meaning`.
 *
 * `description` is additional information provided to the translator.
 */
export class Message {
  constructor(public content: string, public meaning: string, public description: string = null) {}
}

/**
 * Computes the id of a message
 */
export function id(m: Message): string {
  let meaning = isPresent(m.meaning) ? m.meaning : '';
  let content = isPresent(m.content) ? m.content : '';
  return escape(`$ng|${meaning}|${content}`);
}
