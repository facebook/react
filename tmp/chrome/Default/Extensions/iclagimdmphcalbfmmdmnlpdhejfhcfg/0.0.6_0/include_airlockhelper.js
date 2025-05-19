class AirlockHelper {
    #_airlockExtensionID;
    #_airlockConnection;
    #_airlockReady;

    static #AirlockEventOnPermissionRequest(event, connection) {
        var userResponse = false;
        if (confirm(event.message)) {
            userResponse = true;
        }

        var responseMessage = {
            type: 'permissionResponse',
            message: userResponse,
            nonce: event.nonce,
        }
        connection.postMessage(responseMessage)
    }

    static #AirlockEventOnRunResults(event) {
        console.log("run results: " + JSON.stringify(event))
        var div = document.getElementById('AirlockHelperRunResults')
        div.textContent = event.message.message;
    }

    static #AirlockOnMessage(event, connection) {
        switch (event.type) {
            case 'runresults':
                AirlockHelper.#AirlockEventOnRunResults(event)
                break;
            case 'permissionRequest':
                AirlockHelper.#AirlockEventOnPermissionRequest(event, connection)
                break;
            default:
                break;
        }
    }

    static #AirlockOnDisconnect(event) {
        this.#_airlockReady = false;
    }

    #ConnectToAirlock() {
        this.#_airlockConnection = chrome.runtime.connect(this.#_airlockExtensionID)
        this.#_airlockConnection.onMessage.addListener(AirlockHelper.#AirlockOnMessage)
        this.#_airlockConnection.onDisconnect.addListener(AirlockHelper.#AirlockOnDisconnect)
        this.#_airlockReady = true
    }

    constructor(airlockExtensionID, cb) {
        this.#_airlockExtensionID = airlockExtensionID
        this.#_airlockReady = false
    }

    get isAvailable() {
        return this.#_airlockReady
    }

    get ExtensionID() {
        return this.#_airlockExtensionID
    }

    SendMessage(payload) {
        if (this.#_airlockReady != true) {
            this.#ConnectToAirlock()
        }

        var _payload = {
            command: payload,
            type: 'permissionRequest',
        }
        this.#_airlockConnection.postMessage(_payload);
    }
}

var airlockHelper = new AirlockHelper('iclagimdmphcalbfmmdmnlpdhejfhcfg');
