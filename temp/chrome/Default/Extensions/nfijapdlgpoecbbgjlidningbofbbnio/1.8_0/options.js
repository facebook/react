const overrideEndpoint = {
    'element_id': 'override_endpoint',
    // keep this in sync with background.js
    'storage_key': "Meta Google Sheets Plugin Provider - Endpoint",
}
const overrideEnvironment = {
    'element_id': 'override_environment',
    // keep this in sync with background.js
    'storage_key': "Meta Google Sheets Plugin Provider - Environment",
}
const loadOptionsForTextInput = async (options) => {
    let storage = await chrome.storage.session.get(options['storage_key']);
    if (Object.keys(storage).includes(options['storage_key'])) {
        document.getElementById(options['element_id']).value = storage[options['storage_key']];
    } else {
        document.getElementById(options['element_id']).value = "";
    }
}
const loadOptions = async () => {
    await loadOptionsForTextInput(overrideEndpoint);
    await loadOptionsForTextInput(overrideEnvironment);
};
const saveOptions = async () => {
    await chrome.storage.session.set({
        [overrideEndpoint['storage_key']]: document.getElementById(overrideEndpoint['element_id']).value,
        [overrideEnvironment['storage_key']]: document.getElementById(overrideEnvironment['element_id']).value,
     },
    );
    await loadOptions();
};
const resetOptions = async () => {
    await chrome.storage.session.remove([overrideEndpoint['storage_key']]);
    await chrome.storage.session.remove([overrideEnvironment['storage_key']]);
    await loadOptions();
};
document.addEventListener('DOMContentLoaded', loadOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('reset').addEventListener('click', resetOptions);
