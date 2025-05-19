// Name of the alarm which causes a heartbeat request
const HEARTBEAT_ALARM_NAME = "internalfb-heartbeat-alarm";

// Heartbeat period (in minutes)
const HEARTBEAT_ALARM_PERIOD_MIN = 0.5;

// Heartbeat URL to make requests to
// Set to "https://www.my-od.internalfb.com/intern/fbz/heartbeat" for testing
const HEARTBEAT_URL = "https://internalfb.com/intern/fbz/heartbeat";

// Heartbeat JWT for reporting a network error via native extension.
const HEARTBEAT_NETWORK_ERROR_JWT = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJjbWQiOiJoZWFydGJlYXQiLCJhcmdzIjoiY2hyb21lIGV4dGVuc2lvbjogbmV0d29yayBlcnJvciIsImlzcyI6ImRlZmF1bHQiLCJhdWQiOlsiYWlybG9ja2hlbHBlciJdLCJleHAiOjE3NDQzOTIzMzgsIm5iZiI6MTcxMjg1NjAzOCwiaWF0IjoxNzEyODU2MzM4fQ.utommIumQGBadkgYFj5rbJtl41P6m0bNxKEEduLN5GFED9VByaBs2RAm3Y5gsAEi0LkSoQIoLfkTglGWpnvdCw";

// Heartbeat performs a request to InternalFB
async function heartbeat() {
    const mainfest = await chrome.runtime.getManifest();
    const platformInfo = await chrome.runtime.getPlatformInfo();

    var params = new FormData();
    params.set("src", mainfest.name + "-v" + mainfest.version);
    params.set("device_arch", platformInfo.arch);
    params.set("device_os", platformInfo.os);

    const options = {
        method: 'POST',
        body: params,
    };

    try {
        const resp = await fetch(HEARTBEAT_URL, options);
    } catch (err) {
        await onHeartbeatFailure(err);
    }
}

async function onHeartbeatFailure(err) {
    console.error("heartbeat request failed, reporting via native extension", err);

    chrome.runtime.sendNativeMessage("com.meta.airlockhelper", {"message":HEARTBEAT_NETWORK_ERROR_JWT}, function(response) {
        console.log(response);
    });
}

// Heartbeat Listener registered with the alarm
function heartbeatListener(alarm) {
    if (!alarm || alarm.name != HEARTBEAT_ALARM_NAME) {
        return;
    }
    console.debug("Performing InternalFB Heartbeat Check");
    try {
        heartbeat().then(() => {
            console.debug("InternalFB Heartbeat check completed")
        });
    } catch (err) {
        console.error("InternalFB Heartbeat check failed", err);
    }
}

// Register Heartbeat Alarm
async function registerHeartbeat() {
    // Create Alarm
    const alarm = await chrome.alarms.get(HEARTBEAT_ALARM_NAME);
    if (!alarm) {
        await chrome.alarms.create(
            HEARTBEAT_ALARM_NAME,
            {
                delayInMinutes: 0,
                periodInMinutes: HEARTBEAT_ALARM_PERIOD_MIN,
            },
        );
        console.info("InternalFB Heartbeat alarm registered");
    } else {
        console.debug("InternalFB Heartbeat alarm already registered", alarm);
    }

    // Update Listener
    const alreadyHasListener = await chrome.alarms.onAlarm.hasListener(heartbeatListener);
    if (alreadyHasListener) {
        await chrome.alarms.onAlarm.removeListener(heartbeatListener);
    }
    await chrome.alarms.onAlarm.addListener(heartbeatListener);
}

// Reset alarm registration whenever extension is installed or updated
chrome.runtime.onInstalled.addListener(({ reason }) => {
    console.info("Extension update: resetting InternalFB Heartbeat alarm (reason=" + reason + ")");
    chrome.alarms.clear(HEARTBEAT_ALARM_NAME).then(({ wasCleared }) => {
        if (wasCleared) {
            console.debug("Extension update: InternalFB Heartbeat alarm cleared");
        } else {
            console.debug("Extension update: no existing InternalFB Heartbeat alarm was found");
        }
    });
    registerHeartbeat().then(() => {
        console.info("Extension update: InternalFB Heartbeat alarm registered");
    });
});

// Always attempt to register at startup
registerHeartbeat().then(() => { });
