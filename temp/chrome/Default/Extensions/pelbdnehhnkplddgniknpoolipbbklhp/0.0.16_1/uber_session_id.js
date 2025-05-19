/*
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @providesModule uber_session_id
 * @format
 */

//TODO T214867593 get session timeout from GraphQL
export const MAX_IDLE_TIME_MINUTES = 10;

const STORAGE = new Map();
const ACTIVITY_STORAGE = new Map();

export const resetStorage_ONLY_USE_FOR_UNIT_TEST = () => {
  STORAGE.clear();
  ACTIVITY_STORAGE.clear();
};

const getIDFromStorage = tabID => {
  const storageValue = STORAGE.get(String(tabID));
  if (storageValue != null) {
    return storageValue;
  }
  const newID = crypto.randomUUID();
  STORAGE.set(String(tabID), newID);
  return newID;
};

const clearLastActivityTimestamp = tabID => {
  ACTIVITY_STORAGE.set(String(tabID), null);
};

const getLastActivityTimestampMs = tabID => ACTIVITY_STORAGE.get(String(tabID));

const shouldResetUberSessionIDByLastActivityTimestamp = tabID => {
  const lastActivityTimestampMs = getLastActivityTimestampMs(tabID);
  if (lastActivityTimestampMs == null || isNaN(lastActivityTimestampMs)) {
    return false;
  }
  const timeSinceLastActivityMs = Date.now() - lastActivityTimestampMs;
  return timeSinceLastActivityMs > MAX_IDLE_TIME_MINUTES * 60 * 1000;
};

export const updateLastActivityTimestamp = tabID => {
  ACTIVITY_STORAGE.set(String(tabID), Date.now());
};

const resetUberSessionID = tabID => {
  const uberSessionID = crypto.randomUUID();
  STORAGE.set(String(tabID), uberSessionID);
  clearLastActivityTimestamp(tabID);
  return uberSessionID;
};

export const getUberSessionID = tabID => {
  let sessionID = getIDFromStorage(tabID);
  if (
    sessionID == null ||
    shouldResetUberSessionIDByLastActivityTimestamp(tabID)
  ) {
    sessionID = resetUberSessionID(tabID);
  }

  return sessionID;
};
