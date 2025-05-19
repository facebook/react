/*
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @providesModule util
 * @format
 */

function highlight(text, query) {
  const regex = new RegExp(query, 'gi');
  return text.replace(regex, match => `<match>${match}</match>`);
}

export const getSuggestedResult = (text, results, highlight_match) => {
  const uniqueTitles = new Set([text]);
  const entries = [];
  let rank = 1;

  results?.forEach(result => {
    if (!result.title) {
      return;
    }
    if (uniqueTitles.has(result.title)) {
      return;
    }
    uniqueTitles.add(result.title);

    entries.push({
      title: result.title,
      auxiliaryData: {
        source: result.source_type,
        category: 'string',
        rank: rank,
        categoryRank: rank,
      },
    });
    rank++;
  });

  entries.forEach((entry, index) => {
    const isLastBySource =
      index === entries.length - 1 ||
      entry.auxiliaryData.source !== entries[index + 1].auxiliaryData.source;

    entry.auxiliaryData.isLastBySource = isLastBySource;
  });

  const suggestions = entries.map(entry => {
    const title = entry.title;
    return {
      content: title,
      description: highlight_match ? highlight(title, text) : title,
    };
  });

  return {suggestions, entries};
};
