// keep this in sync with options.js
const OVERRIDE_ENDPOINT_STORAGE_KEY = "Meta Google Sheets Plugin Provider - Endpoint";
const OVERRIDE_ENVIRONMENT_STORAGE_KEY = "Meta Google Sheets Plugin Provider - Environment";
const BASE_URL = "https://www.internalfb.com";
let GLOBAL_DTSG = null;
const MUTATION_NAME = 'xfb_headcount_management_google_sheets_mutation';
let TEST_MODE = false;

const getStorageWithDefault = async (key, def) => {
  let storage = await chrome.storage.session.get(key);
  if (Object.keys(storage).includes(key)) {
    const value = storage[key];
    if (value.length > 0) {
      return value;
    }
  }
  return def;
}

const getDtsg = async () => {
  const currentEpoch = new Date().getTime() / 1000 - 15; // cache token for 15 seconds
  if (GLOBAL_DTSG != null && GLOBAL_DTSG.expire > currentEpoch) {
    return GLOBAL_DTSG.token;
  }
  const response = await fetch("https://www.internalfb.com/intern/api/dtsg/internal");
  const responseText = await response.text();
  const responseParsed = responseText.substring(responseText.indexOf('{'));
  GLOBAL_DTSG = JSON.parse(responseParsed);
  return GLOBAL_DTSG.token;
}

const encodeFormData = (data) => {
  return Object.keys(data)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    .join('&');
}

// https://fburl.com/wiki/iwjfs47c - to resolve doc_id, bunnylol: `graphiql <doc_id>`
const doQuery = async (doc_id, variables) => {
  const baseURL = await getStorageWithDefault(OVERRIDE_ENDPOINT_STORAGE_KEY, "https://www.internalfb.com");
  let environment = await getStorageWithDefault(OVERRIDE_ENVIRONMENT_STORAGE_KEY, TEST_MODE ? 'test' : 'prod');
  const url = environment != null ? `${baseURL}/intern/api/graphql/?env=${environment}` : `${baseURL}/intern/api/graphql/`;
  const token = await getDtsg();
  const jsonVariables = variables != null ? JSON.stringify(variables) : '';
  const response = await fetch(url, {
    body: encodeFormData({doc_id, fb_dtsg: token, variables: jsonVariables}),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  });
  return response.json();
}

const genValidateSheetExistence = async (spreadsheet_id, sheet_id) => {
  const variables = {actor_id: 0, client_mutation_id: 0};
  let response = await doQuery("23878021575122225", {data: variables, spreadsheet_id: spreadsheet_id, sheet_id: sheet_id});
  if (response?.data?.xfb_headcount_management_check_google_sheet_existence == null) {
    TEST_MODE = !TEST_MODE;
    response = await doQuery("23878021575122225", {data: variables, spreadsheet_id: spreadsheet_id, sheet_id: sheet_id});
  }
  return response;
}

const genTriggerAsync = async (sheet_fbid, action) => {
  const variables = {actor_id: 0, client_mutation_id: 0, headcount_sheet_id: sheet_fbid, action: action};
  let response = await doQuery("6765822836830262", {data: variables, headcount_sheet_id: sheet_fbid, action: action});
  if (response?.errors?.[0]?.exception?.class == "NotFoundDataTypeException") {
    TEST_MODE = !TEST_MODE;
    response = await doQuery("6765822836830262", {data: variables, headcount_sheet_id: sheet_fbid, action: action});
  }
  return response;
}

chrome.declarativeNetRequest.getDynamicRules((rules) => {
  const ids = rules.map(rule => {
    if (rule.condition.urlFilter === "internalfb.com/intern/api/graphql" && rule.action.type === "modifyHeaders") {
        return rule.id;
    }
    return null;
  }).filter(Boolean);
  if (ids.length > 0) {
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ids
    })
  }
})

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  const {action, payload} = message;
  if (action === 'validateSheetExistence') {
    genValidateSheetExistence(payload.spreadsheet_id, payload.sheet_id).then(sendResponse);
    return true;
  } else if (action === 'triggerAsync') {
    genTriggerAsync(payload.sheet_fbid, payload.action_type)
      .then((response) => {
        if (response?.errors?.length != null && response.errors.length > 0) {
          sendResponse({message: response.errors.map(({exception: {message}}) => message), status: 'ERROR'});
        }
        const responseMessage = response?.data?.xfb_headcount_management_google_sheets_mutation_v2?.response_message;
        if (responseMessage == null) {
          sendResponse({message: 'Response message was missing, unsure what the status of the request is.', status: 'WARN'});
        }
        sendResponse(responseMessage);
      })
    return true;
  }
});
