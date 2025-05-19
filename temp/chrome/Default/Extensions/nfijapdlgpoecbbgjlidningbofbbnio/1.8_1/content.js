let shouldValidateURL = true;
let tryToInject = false;

const url = new URL(window.location.href)
const spreadsheet_id = url.pathname.split("/")[3];
const sheet_id = url.hash.split("=")[1];
let sheet_fbid = null;
let allowed_actions = [];
const SPINNER_ID = `hcm_activation_spinner`;
const TOAST_ID = 'hcm_toast';
const STYLE_CLASSES = {
    container: 'hcm-action-container',
    action: 'hcm-action',
    disabled: 'hcm-action-disabled',
    loader: 'hcm-loader',
    inFlight: 'hcm-action-in-flight',
    toastCard: 'hcm-toast-card',
    title: 'hcm-title',
    body: 'hcm-body',
    fade: 'hcm-fade',
    success: 'hcm-success',
    error: 'hcm-error',
    info: 'hcm-info',
    toastContainer: 'hcm-toast-container',
    closeIcon: 'hcm-close-icon',
    titleContainer: 'hcm-toast-title-container',
    holdAndFade: 'hcm-hold-and-fade',
    warn: 'hcm-warn'
}

const GDOC_CLASSES = {
    sheet_div: 'docs-sheet-tab',
}

setInterval(() => {
    if (shouldValidateURL) {
        shouldValidateURL = false;
        chrome.runtime.sendMessage({action: "validateSheetExistence", payload: {spreadsheet_id, sheet_id}}, (response) => {
            const headcount_sheet = response.data.xfb_headcount_management_check_google_sheet_existence;
            sheet_fbid = headcount_sheet.id;
            allowed_actions = headcount_sheet.actions;
            if (sheet_fbid != null) {
                tryToInject = true;
            }
        });
    }
    if (tryToInject) {
        const helpButton = document.querySelector("#docs-help-menu");
        if (helpButton != null) {
            allowed_actions.map(action_type => {
                insertActionNode(helpButton, action_type);
            })
            tryToInject = false;
        }
    }
}, 1000)

function insertActionNode(baseNode, actionType) {
    const newParent = actionParent(baseNode, actionType);
    const newChild = actionNode(actionType);
    baseNode.insertAdjacentElement("afterend", newParent);
    newParent.appendChild(newChild);
}

function actionParent(baseNode, actionType) {
    const newParent = baseNode.cloneNode(true);
    newParent.classList.add(STYLE_CLASSES.container);
    newParent.id = getActionContainerId(actionType);
    newParent.innerText = null;
    return newParent;
}

function actionNode(actionType) {
    const newChild = document.createElement('div');
    newChild.classList.add(STYLE_CLASSES.action);
    newChild.id = getElementId(actionType);
    newChild.innerText = actionType;
    newChild.onclick = onActionClick(actionType);
    return newChild;
}

// curries action_type
function onActionClick(action_type) {
    return () => {
        startActions(action_type);
        chrome.runtime.sendMessage({action: "triggerAsync", payload: {sheet_fbid, action_type,}}, (response) => {
            finishActions(action_type);
            console.log("response", response);
            switch (response.status) {
                case 'SUCCESS': {
                    Toast.displayToast(
                        successResponseToHTML(response, action_type),
                        'SUCCESS'
                    );
                    break;
                }
                case 'WARN': {
                    Toast.displayToast(warnResponseToHTML(response, action_type), 'WARN');
                    break;
                }
                case 'ERROR': {
                    Toast.displayToast(failureResponseToHTML(response, action_type), 'ERROR');
                    break;
                }
                default:
                    break;
            }

        });
    }
}

function successResponseToHTML(response, actionType) {
    const container = document.createElement('div');
    container.classList.add(STYLE_CLASSES.body);
    container.innerText = buildResponseMessage(response, `${actionType} was successful`);
    if (response?.redirect != null) {
        const link = createRedirectElement(response.redirect);
        container.append(document.createElement('br'))
        container.append(link);
    }
    return container;
}

function buildResponseMessage(response, baseMessage) {
    if (response?.message != null) {
        return baseMessage + `: ${response.message}`;
    }
    return baseMessage;
}

function createRedirectElement(redirect) {
    const redirectLink = document.createElement('a');
    redirectLink.setAttribute('href', redirect);
    redirectLink.setAttribute('target', '_top');
    redirectLink.innerText = 'See more details here.';
    return redirectLink;
}

function failureResponseToHTML(response, actionType) {
    const container = document.createElement('div');
    container.classList.add(STYLE_CLASSES.body);
    container.innerText = buildResponseMessage(response, `${actionType} failed with errors`);
    if (response?.redirect != null) {
        const link = createRedirectElement(response.redirect);
        container.append(document.createElement('br'))
        container.append(link);
    }
    return container;
}

function warnResponseToHTML(response, actionType) {
    const container = document.createElement('div');
    container.classList.add(STYLE_CLASSES.body);
    container.innerText = buildResponseMessage(response, `${actionType} returned a warning`);
    return container;
}

function startActions(action_type) {
    disableAllActions();
    addSpinnerElement(action_type);
    setActionInFlight(action_type);
}

function finishActions(action_type) {
    unsetActionInFlight(action_type);
    removeSpinner();
    enableAllActions();
}

function unsetActionInFlight(action_type) {
    const actionElement = getActionContainerElement(action_type);
    actionElement.classList.remove(STYLE_CLASSES.inFlight);
}

function setActionInFlight(action_type) {
    const actionElement = getActionContainerElement(action_type);
    actionElement.classList.add(STYLE_CLASSES.inFlight);
}

function addSpinnerElement(action_type) {
    const spinnerElement = document.createElement('div');
    spinnerElement.classList.add(STYLE_CLASSES.loader);
    spinnerElement.id = SPINNER_ID;
    const actionElement = getDomElement(action_type);
    actionElement.insertAdjacentElement("afterend",spinnerElement);
}

function insertSpinnerChildren(spinner) {
    for (let i = 0; i < 4; i++) {
        const child = document.createElement('div');
        spinner.appendChild(child);
    }
}

function removeSpinner() {
    const spinner = document.getElementById(SPINNER_ID);
    if (spinner!== null) {
        spinner.parentNode.removeChild(spinner);
    }
}

function disableAllActions() {
    allowed_actions.forEach(disableActionElement);
}

function enableAllActions() {
    allowed_actions.forEach(enableActionElement);
}

function getElementId(action_type) {
  return `hcm_activation_${action_type}`;
}

function getDomElement(action_type) {
  return document.getElementById(getElementId(action_type));
}

function getActionContainerElement(action_type) {
  return document.getElementById(getActionContainerId(action_type));
}

function getActionContainerId(action_type) {
  return `${getElementId(action_type)}-container`;
}

function disableActionElement(action_type) {
    const domElement = getDomElement(action_type);
    const actionContainer = getActionContainerElement(action_type);
    actionContainer.classList.add(STYLE_CLASSES.disabled);
    domElement.classList.add(STYLE_CLASSES.disabled);
}

function enableActionElement(action_type) {
    const domElement = getDomElement(action_type);
    const actionContainer = getActionContainerElement(action_type);
    actionContainer.classList.remove(STYLE_CLASSES.disabled);
    domElement.classList.remove(STYLE_CLASSES.disabled);
}

let _toastContainer = null;

class Toast {
    static _getToastContainer() {
        if (_toastContainer == null) {
            _toastContainer = Toast._makeToastContainer();
        }
        return _toastContainer;
    }

    static _makeToastContainer() {
        const toast = document.createElement('div');
        toast.classList.add(STYLE_CLASSES.toastContainer);
        toast.id = TOAST_ID;
        document.body.appendChild(toast);
        return toast;
    }

    static _makeToastCard() {
        const toast = document.createElement('div');
        toast.classList.add(STYLE_CLASSES.toastCard);
        toast.id = crypto.randomUUID();
        toast.addEventListener('animationend', () => {
            Toast._unmountToast(toast.id);
        });
        toast.addEventListener('mouseover', () => {
            Toast._stopFade(toast.id);
        });
        toast.addEventListener('mouseleave', () => {
            Toast._startFade(toast.id);
        });
        return toast;
    }

    static _makeToastTitle(toastCard, toastType) {
        const titleContainer = document.createElement('div');
        titleContainer.classList.add(STYLE_CLASSES.titleContainer);
        const title = document.createElement('div');
        title.classList.add(STYLE_CLASSES.title);
        const closeIcon = document.createElement('div');
        closeIcon.classList.add(STYLE_CLASSES.closeIcon);
        closeIcon.addEventListener('click', () => {
            Toast._unmountToast(toastCard.id);
        })
        switch (toastType) {
            case 'SUCCESS':
                title.classList.add(STYLE_CLASSES.success);
                title.innerText = "Success";
                break;
            case 'ERROR':
                title.classList.add(STYLE_CLASSES.error);
                title.innerText = "Error";
                break;
            case 'WARN':
                title.classList.add(STYLE_CLASSES.warn);
                title.innerText = "Warning";
                break;
            case 'INFO':
            default:
                title.classList.add(STYLE_CLASSES.info)
                title.innerText = "Info";
                break;
        }
        titleContainer.appendChild(title);
        titleContainer.appendChild(closeIcon);
        toastCard.appendChild(titleContainer);
    }

    static _makeToastBody(toastCard, html) {
        html.classList.add(STYLE_CLASSES.body);
        toastCard.appendChild(html);
    }

    static _getToastCard(id) {
        return document.getElementById(id);
    }

    static displayToast(html, toastType) {
        const toast = Toast._setToast(html, toastType);
        Toast._getToastContainer().appendChild(toast);
    }

    static _startFade(id) {
        const toast = Toast._getToastCard(id);
        toast.classList.add(STYLE_CLASSES.fade);
    }

    static _unmountToast(id) {
        Toast._getToastCard(id).remove();
    }

    static _stopFade(id) {
        const toast = Toast._getToastCard(id);
        toast.classList.remove(STYLE_CLASSES.fade);
        toast.classList.remove(STYLE_CLASSES.holdAndFade);
    }

    static _startHoldAndFade(id) {
        const toast = Toast._getToastCard(id);
        toast.classList.add(STYLE_CLASSES.holdAndFade);
    }

    static _setToast(html, toastType) {
        const toast = Toast._makeToastCard();
        Toast._makeToastTitle(toast, toastType);
        Toast._makeToastBody(toast, html);
        Toast._getToastContainer().appendChild(toast);
        Toast._startHoldAndFade(toast.id)
        return toast;
    }
}
