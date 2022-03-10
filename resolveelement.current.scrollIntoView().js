// I decided to let the user scroll freely along the page and when they stop scrolling, then determine the closest DOM element and scroll to it. Works on Edge, Chrome and Firefox

window.contentcenter = {
    contentCenter: function (elementId) {
        var centeringFunction = debounce(function () { autocenter(elementId) }, 200);
        document.addEventListener("scroll", centeringFunction);
    }
}

function autocenter(elementId) {
    var currentElement = detectCurrentElement(elementId);
    currentElement.scrollIntoView({ behavior: "smooth" });
}

function detectCurrentElement(elementId) {
    var element = document.getElementById(elementId);
    var currentPos = window.scrollY;
    var contentIdList = getContentIdList(elementId);
    var currentElement = closestContent(currentPos, element, contentIdList);

    return currentElement;
}

function closestContent(pos, element, contentIdList) {
    var contentId = Math.round(pos / (element.offsetHeight / contentIdList.length));
    var currentElement = document.getElementById(contentIdList[contentId]);
    return currentElement;
}

function getContentIdList(elementId) {
    var idList = []
    var childElements = document.getElementById(elementId).children;
    for (var i = 0; i < childElements.length; i++) {
        idList.push(childElements[i].id);
    }
    return idList;
}

function debounce(func, timeout) {
    var timer;
    return function () {
        var context = this, args = arguments;
        var later = function () {
            timer = null;
            func.apply(context, args);
        };
        clearTimeout(timer);
        timer = setTimeout(later, timeout)
    };
}