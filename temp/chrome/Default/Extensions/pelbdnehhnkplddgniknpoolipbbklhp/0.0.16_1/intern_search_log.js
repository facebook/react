/*
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @providesModule intern_search_log
 * @format
 */

export const buildLogApiRequest = query => {
  return {
    event: 'typeahead_api_request',
    payload: {
      query: query,
    },
  };
};

export const buildLogSuggestionRender = (query, entry) => {
  return {
    event: 'typeahead_suggestion_render',
    payload: {
      query: query,
      typeahead_input_query: entry.title,
      typeahead_suggested_query: entry.title,
      extra_data: {
        source: entry.auxiliaryData?.source,
        category: entry.auxiliaryData?.category,
      },
    },
  };
};

export const buildLogSuggestionSourceRender = (query, entry, loadTimeMs) => {
  return {
    event: 'typeahead_suggestion_source_render',
    payload: {
      query: query,
      extra_data: {
        source: entry.auxiliaryData?.source,
        category: entry.auxiliaryData?.category,
      },
      load_time_ms: loadTimeMs,
    },
  };
};

export const buildLogSuggestionVPV = (query, entry) => {
  return {
    event: 'typeahead_suggestion_vpv',
    payload: {
      query: query,
      typeahead_input_query: entry.title,
      typeahead_suggested_query: entry.title,
      extra_data: {
        source: entry.auxiliaryData?.source,
        category: entry.auxiliaryData?.category,
        global_rank: entry.auxiliaryData?.rank,
        within_category_rank: entry.auxiliaryData?.categoryRank,
      },
      rank: entry.auxiliaryData?.rank,
    },
  };
};

export const buildLogSuggestion = query => {
  return {
    event: 'typeahead_suggestion',
    payload: {
      query: query,
    },
  };
};

export const buildLogSuggestionSelect = (query, entry) => {
  return {
    event: 'typeahead_suggestion_select',
    payload: {
      query: query,
      typeahead_input_query: entry.title,
      typeahead_suggested_query: entry.title,
      extra_data: {
        source: entry.auxiliaryData?.source,
        category: entry.auxiliaryData?.category,
        global_rank: entry.auxiliaryData?.rank,
        within_category_rank: entry.auxiliaryData?.categoryRank,
      },
      rank: entry.auxiliaryData?.rank,
    },
  };
};
