(function () {
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
      null != dataset.rxi
        ? ($RX(
            dataset.bid,
            dataset.dgst,
            dataset.msg,
            dataset.stck,
            dataset.cstck
          ),
          node_.remove())
        : null != dataset.rri
          ? ($RR(dataset.bid, dataset.sid, JSON.parse(dataset.sty)),
            node_.remove())
          : null != dataset.rci
            ? ($RC(dataset.bid, dataset.sid), node_.remove())
            : null != dataset.rsi &&
              ($RS(dataset.sid, dataset.pid), node_.remove());
    }
  }
  var $RT;
  var $RM = new Map();
  var $RB = [];
  var $RX = function (
    suspenseBoundaryID,
    errorDigest,
    errorMsg,
    errorStack,
    errorComponentStack
  ) {
    var suspenseIdNode = document.getElementById(suspenseBoundaryID);
    suspenseIdNode &&
      ((suspenseBoundaryID = suspenseIdNode.previousSibling),
      (suspenseBoundaryID.data = "$!"),
      (suspenseIdNode = suspenseIdNode.dataset),
      errorDigest && (suspenseIdNode.dgst = errorDigest),
      errorMsg && (suspenseIdNode.msg = errorMsg),
      errorStack && (suspenseIdNode.stck = errorStack),
      errorComponentStack && (suspenseIdNode.cstck = errorComponentStack),
      suspenseBoundaryID._reactRetry && suspenseBoundaryID._reactRetry());
  };
  var $RV = function (revealBoundaries) {
    try {
      var existingTransition = document.__reactViewTransition;
      if (existingTransition) {
        existingTransition.finished.then($RV, $RV);
        return;
      }
      if (window._useVT) {
        var transition = (document.__reactViewTransition =
          document.startViewTransition({
            update: revealBoundaries,
            types: []
          }));
        transition.finished.finally(function () {
          document.__reactViewTransition === transition &&
            (document.__reactViewTransition = null);
        });
        return;
      }
    } catch (x) {}
    revealBoundaries();
  }.bind(null, function () {
    $RT = performance.now();
    var batch = $RB;
    $RB = [];
    for (var i = 0; i < batch.length; i += 2) {
      var suspenseIdNode = batch[i],
        contentNode = batch[i + 1],
        parentInstance = suspenseIdNode.parentNode;
      if (parentInstance) {
        var suspenseNode = suspenseIdNode.previousSibling,
          depth = 0;
        do {
          if (suspenseIdNode && 8 === suspenseIdNode.nodeType) {
            var data = suspenseIdNode.data;
            if ("/$" === data || "/&" === data)
              if (0 === depth) break;
              else depth--;
            else
              ("$" !== data &&
                "$?" !== data &&
                "$~" !== data &&
                "$!" !== data &&
                "&" !== data) ||
                depth++;
          }
          data = suspenseIdNode.nextSibling;
          parentInstance.removeChild(suspenseIdNode);
          suspenseIdNode = data;
        } while (suspenseIdNode);
        for (; contentNode.firstChild; )
          parentInstance.insertBefore(contentNode.firstChild, suspenseIdNode);
        suspenseNode.data = "$";
        suspenseNode._reactRetry && suspenseNode._reactRetry();
      }
    }
  });
  var $RC = function (suspenseBoundaryID, contentID) {
    if ((contentID = document.getElementById(contentID)))
      if (
        (contentID.parentNode.removeChild(contentID),
        (suspenseBoundaryID = document.getElementById(suspenseBoundaryID)))
      )
        (suspenseBoundaryID.previousSibling.data = "$~"),
          $RB.push(suspenseBoundaryID, contentID),
          2 === $RB.length &&
            ((suspenseBoundaryID =
              ("number" !== typeof $RT ? 0 : $RT) + 300 - performance.now()),
            setTimeout($RV, suspenseBoundaryID));
  };
  var $RR = function (suspenseBoundaryID, contentID, stylesheetDescriptors) {
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
        : ("LINK" === node.tagName && $RM.set(node.getAttribute("href"), node),
          precedences.set(node.dataset.precedence, (lastResource = node)));
    nodes = 0;
    node = [];
    var precedence, resourceEl;
    for (i$0 = !0; ; ) {
      if (i$0) {
        var stylesheetDescriptor = stylesheetDescriptors[nodes++];
        if (!stylesheetDescriptor) {
          i$0 = !1;
          nodes = 0;
          continue;
        }
        var avoidInsert = !1,
          j = 0;
        var href = stylesheetDescriptor[j++];
        if ((resourceEl = $RM.get(href))) {
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
          $RM.set(href, resourceEl);
        }
        href = resourceEl.getAttribute("media");
        !attr || (href && !window.matchMedia(href).matches) || node.push(attr);
        if (avoidInsert) continue;
      } else {
        resourceEl = styleTagsToHoist[nodes++];
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
    if ((stylesheetDescriptors = document.getElementById(suspenseBoundaryID)))
      stylesheetDescriptors.previousSibling.data = "$~";
    Promise.all(node).then(
      $RC.bind(null, suspenseBoundaryID, contentID),
      $RX.bind(null, suspenseBoundaryID, "CSS failed to load")
    );
  };
  var $RS = function (containerID, placeholderID) {
    containerID = document.getElementById(containerID);
    placeholderID = document.getElementById(placeholderID);
    for (
      containerID.parentNode.removeChild(containerID);
      containerID.firstChild;

    )
      placeholderID.parentNode.insertBefore(
        containerID.firstChild,
        placeholderID
      );
    placeholderID.parentNode.removeChild(placeholderID);
  };
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
  var entries = performance.getEntriesByType
    ? performance.getEntriesByType("paint")
    : [];
  0 < entries.length
    ? ($RT = entries[0].startTime)
    : requestAnimationFrame(function () {
        $RT = performance.now();
      });
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
