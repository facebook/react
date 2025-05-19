/*
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @providesModule search_request_id
 * @format
 */

const STORAGE = new Map();

export const getSearchRequestID = tabID => {
  const storedID = STORAGE.get(String(tabID));
  if (storedID != null) {
    return storedID;
  }
  const generatedID = crypto.randomUUID();
  STORAGE.set(String(tabID), generatedID);
  return generatedID;
};

export const clearSearchRequestID = tabID => STORAGE.delete(String(tabID));

export const resetStorage_ONLY_USE_FOR_UNIT_TEST = () => {
  STORAGE.clear();
};
