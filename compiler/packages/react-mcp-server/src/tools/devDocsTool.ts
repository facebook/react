import * as cheerio from 'cheerio';
import {convert} from 'html-to-text';
import {queryAlgolia} from '../utils/algolia';

type DevDocsToolOutput = {
  kind: 'success';
  content: Array<string>;
} | {
  kind: 'error';
  text: string;
}

/**
 * Tool for querying React dev docs from react.dev
 * @param query The search query to look up in the React documentation
 * @returns A promise that resolves to the search results
 */
export async function devDocsTool(query: string): Promise<DevDocsToolOutput> {
  try {
    const pages = await queryAlgolia(query);
    if (pages.length === 0) {
      return {
        kind: 'error',
        text: `No results`,
      };
    }
    const content = pages.map(html => {
      const $ = cheerio.load(html);
      // react.dev should always have at least one <article> with the main content
      const article = $('article').html();
      if (article != null) {
        return convert(article)
      } else {
        return convert($.html())
      }
    });
    return {
      kind: 'success',
      content,
    };
  } catch (err) {
    return {
      kind: 'error',
      text: `Error: ${err.stack}`,
    };
  }
}
