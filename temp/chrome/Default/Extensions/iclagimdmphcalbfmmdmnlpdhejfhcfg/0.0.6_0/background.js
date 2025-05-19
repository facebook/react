// Initialize FBZ Heartbeat
try {
    importScripts('include_heartbeat.js');
} catch (err) {
    console.error("failed to initialize fbz heartbeat", err);
}

var webConnection
var _requestedCommand = new Map();

var msgListener = function (event) {
    // receive event from the webpage.
    switch (event.type) {
        case 'permissionResponse':
            permissionResponse(event)
            break;
        case 'permissionRequest':
            permissionRequest(event);
            break;
        default:
            console.log("unknown airlock helper request: " + event.type)
    }
}

chrome.runtime.onConnectExternal.addListener(
    function (connection) {
        webConnection = connection
        connection.onMessage.addListener(msgListener)
    }
);

chrome.runtime.onSuspend.addListener(() => {
    console.log("on suspend");
});

function permissionResponse(event) {
    if (!_requestedCommand[event.nonce]) {
        return
    }

    const command = _requestedCommand[event.nonce];
    delete _requestedCommand[event.nonce];

    if (event.message != true) {
        console.log("Command was not approved.")
        return
    }

    if (!(typeof command === "string")) {
        console.log("Command of wrong instance type: " + typeof command)
        return
    }

    _airlockMessage = {
        "message": command,
    }

    console.log("Sending Native Message: " + JSON.stringify(_airlockMessage))
    chrome.runtime.sendNativeMessage("com.meta.airlockhelper", _airlockMessage, (response) => {
        _response = {
            type: "runresults",
            message: response,
        }
        webConnection.postMessage(_response)
    });
}

function permissionRequest(event) {
    if (event.command == null) {
        return
    }

    var nonce = crypto.randomUUID();

    permissionRequestMessage = {
        type: "permissionRequest",
        message: "Airlock Helper is requesting permission to run a command.",
        nonce: nonce,
    }
    _requestedCommand[nonce] = event.command;
    webConnection.postMessage(permissionRequestMessage);
}
