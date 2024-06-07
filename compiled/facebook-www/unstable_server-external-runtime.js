(function () {
  function completeBoundary(suspenseBoundaryID, contentID, errorDigest) {
    contentID = document.getElementById(contentID);
    contentID.parentNode.removeChild(contentID);
    var suspenseIdNode = document.getElementById(suspenseBoundaryID);
    if (suspenseIdNode) {
      suspenseBoundaryID = suspenseIdNode.previousSibling;
      if (errorDigest)
        (suspenseBoundaryID.data = "$!"),
          suspenseIdNode.setAttribute("data-dgst", errorDigest);
      else {
        errorDigest = suspenseBoundaryID.parentNode;
        suspenseIdNode = suspenseBoundaryID.nextSibling;
        var depth = 0;
        do {
          if (suspenseIdNode && 8 === suspenseIdNode.nodeType) {
            var data = suspenseIdNode.data;
            if ("/$" === data)
              if (0 === depth) break;
              else depth--;
            else ("$" !== data && "$?" !== data && "$!" !== data) || depth++;
          }
          data = suspenseIdNode.nextSibling;
          errorDigest.removeChild(suspenseIdNode);
          suspenseIdNode = data;
        } while (suspenseIdNode);
        for (; contentID.firstChild; )
          errorDigest.insertBefore(contentID.firstChild, suspenseIdNode);
        suspenseBoundaryID.data = "$";
      }
      suspenseBoundaryID._reactRetry && suspenseBoundaryID._reactRetry();
    }
  }
  function completeBoundaryWithStyles(
    suspenseBoundaryID,
    contentID,
    stylesheetDescriptors
  ) {
    function cleanupWith(cb) {
      this._p = null;
      cb();
    }
    for (
      var precedences = new Map(),
        thisDocument = document,
        lastResource,
        node,
        nodes = thisDocument.querySelectorAll(
          "link[data-precedence],style[data-precedence]"
        ),
        styleTagsToHoist = [],
        i$0 = 0;
      (node = nodes[i$0++]);

    )
      "not all" === node.getAttribute("media")
        ? styleTagsToHoist.push(node)
        : ("LINK" === node.tagName &&
            resourceMap.set(node.getAttribute("href"), node),
          precedences.set(node.dataset.precedence, (lastResource = node)));
    node = 0;
    nodes = [];
    var precedence, resourceEl;
    for (i$0 = !0; ; ) {
      if (i$0) {
        var stylesheetDescriptor = stylesheetDescriptors[node++];
        if (!stylesheetDescriptor) {
          i$0 = !1;
          node = 0;
          continue;
        }
        var avoidInsert = !1,
          j = 0;
        var href = stylesheetDescriptor[j++];
        if ((resourceEl = resourceMap.get(href))) {
          var attr = resourceEl._p;
          avoidInsert = !0;
        } else {
          resourceEl = thisDocument.createElement("link");
          resourceEl.href = href;
          resourceEl.rel = "stylesheet";
          for (
            resourceEl.dataset.precedence = precedence =
              stylesheetDescriptor[j++];
            (attr = stylesheetDescriptor[j++]);

          )
            resourceEl.setAttribute(attr, stylesheetDescriptor[j++]);
          attr = resourceEl._p = new Promise(function (resolve, reject) {
            resourceEl.onload = cleanupWith.bind(resourceEl, resolve);
            resourceEl.onerror = cleanupWith.bind(resourceEl, reject);
          });
          resourceMap.set(href, resourceEl);
        }
        href = resourceEl.getAttribute("media");
        !attr || (href && !window.matchMedia(href).matches) || nodes.push(attr);
        if (avoidInsert) continue;
      } else {
        resourceEl = styleTagsToHoist[node++];
        if (!resourceEl) break;
        precedence = resourceEl.getAttribute("data-precedence");
        resourceEl.removeAttribute("media");
      }
      avoidInsert = precedences.get(precedence) || lastResource;
      avoidInsert === lastResource && (lastResource = resourceEl);
      precedences.set(precedence, resourceEl);
      avoidInsert
        ? avoidInsert.parentNode.insertBefore(
            resourceEl,
            avoidInsert.nextSibling
          )
        : ((avoidInsert = thisDocument.head),
          avoidInsert.insertBefore(resourceEl, avoidInsert.firstChild));
    }
    Promise.all(nodes).then(
      completeBoundary.bind(null, suspenseBoundaryID, contentID, ""),
      completeBoundary.bind(
        null,
        suspenseBoundaryID,
        contentID,
        "Resource failed to load"
      )
    );
  }
  function handleExistingNodes(target) {
    target = target.querySelectorAll("template");
    for (var i = 0; i < target.length; i++) handleNode(target[i]);
  }
  function installFizzInstrObserver(target) {
    function handleMutations(mutations) {
      for (var i = 0; i < mutations.length; i++)
        for (
          var addedNodes = mutations[i].addedNodes, j = 0;
          j < addedNodes.length;
          j++
        )
          addedNodes[j].parentNode && handleNode(addedNodes[j]);
    }
    var fizzInstrObserver = new MutationObserver(handleMutations);
    fizzInstrObserver.observe(target, { childList: !0 });
    window.addEventListener("DOMContentLoaded", function () {
      handleMutations(fizzInstrObserver.takeRecords());
      fizzInstrObserver.disconnect();
    });
  }
  function handleNode(node_) {
    if (1 === node_.nodeType && node_.dataset) {
      var dataset = node_.dataset;
      if (null != dataset.rxi) {
        var errorDigest = dataset.dgst,
          errorMsg = dataset.msg,
          errorStack = dataset.stck,
          errorComponentStack = dataset.cstck,
          suspenseIdNode = document.getElementById(dataset.bid);
        suspenseIdNode &&
          ((dataset = suspenseIdNode.previousSibling),
          (dataset.data = "$!"),
          (suspenseIdNode = suspenseIdNode.dataset),
          errorDigest && (suspenseIdNode.dgst = errorDigest),
          errorMsg && (suspenseIdNode.msg = errorMsg),
          errorStack && (suspenseIdNode.stck = errorStack),
          errorComponentStack && (suspenseIdNode.cstck = errorComponentStack),
          dataset._reactRetry && dataset._reactRetry());
        node_.remove();
      } else if (null != dataset.rri)
        completeBoundaryWithStyles(
          dataset.bid,
          dataset.sid,
          JSON.parse(dataset.sty)
        ),
          node_.remove();
      else if (null != dataset.rci)
        completeBoundary(dataset.bid, dataset.sid), node_.remove();
      else if (null != dataset.rsi) {
        errorDigest = dataset.pid;
        errorMsg = document.getElementById(dataset.sid);
        errorDigest = document.getElementById(errorDigest);
        for (errorMsg.parentNode.removeChild(errorMsg); errorMsg.firstChild; )
          errorDigest.parentNode.insertBefore(errorMsg.firstChild, errorDigest);
        errorDigest.parentNode.removeChild(errorDigest);
        node_.remove();
      }
    }
  }
  var resourceMap = new Map();
  (function () {
    addEventListener("submit", function (event) {
      if (!event.defaultPrevented) {
        var form = event.target,
          submitter = event.submitter,
          action = form.action,
          formDataSubmitter = submitter;
        if (submitter) {
          var submitterAction = submitter.getAttribute("formAction");
          null != submitterAction &&
            ((action = submitterAction), (formDataSubmitter = null));
        }
        "javascript:throw new Error('React form unexpectedly submitted.')" ===
          action &&
          (event.preventDefault(),
          formDataSubmitter
            ? ((event = document.createElement("input")),
              (event.name = formDataSubmitter.name),
              (event.value = formDataSubmitter.value),
              formDataSubmitter.parentNode.insertBefore(
                event,
                formDataSubmitter
              ),
              (formDataSubmitter = new FormData(form)),
              event.parentNode.removeChild(event))
            : (formDataSubmitter = new FormData(form)),
          (event = form.ownerDocument || form),
          (event.$$reactFormReplay = event.$$reactFormReplay || []).push(
            form,
            submitter,
            formDataSubmitter
          ));
      }
    });
  })();
  window.$RC || ((window.$RC = completeBoundary), (window.$RM = new Map()));
  if (null != document.body)
    "loading" === document.readyState &&
      installFizzInstrObserver(document.body),
      handleExistingNodes(document.body);
  else {
    var domBodyObserver = new MutationObserver(function () {
      null != document.body &&
        ("loading" === document.readyState &&
          installFizzInstrObserver(document.body),
        handleExistingNodes(document.body),
        domBodyObserver.disconnect());
    });
    domBodyObserver.observe(document.documentElement, { childList: !0 });
  }
})();
