// Instruction Set

// The following code is the source scripts that we then minify and inline below,
// with renamed function names that we hope don't collide:

// const COMMENT_NODE = 8;
// const SUSPENSE_START_DATA = '$';
// const SUSPENSE_END_DATA = '/$';
// const SUSPENSE_PENDING_START_DATA = '$?';
// const SUSPENSE_FALLBACK_START_DATA = '$!';
// const LOADED = 'l';
// const ERRORED = 'e';

// resourceMap = new Map();
// function completeBoundaryWithStyles(suspenseBoundaryID, contentID, styles) {
//   const precedences = new Map();
//   const thisDocument = document;
//   let lastResource, node;

//   // Seed the precedence list with existing resources
//   let nodes = thisDocument.querySelectorAll('link[data-rprec]');
//   for (let i = 0;node = nodes[i++];) {
//     precedences.set(node.dataset.rprec, lastResource = node);
//   }

//   let i = 0;
//   let dependencies = [];
//   let style, href, precedence, attr, loadingState, resourceEl;

//   function setStatus(s) {
//     this.s = s;
//   }

//   while (style = styles[i++]) {
//     let j = 0;
//     href = style[j++];
//     // We check if this resource is already in our resourceMap and reuse it if so.
//     // If it is already loaded we don't return it as a depenendency since there is nothing
//     // to wait for
//     loadingState = resourceMap.get(href);
//     if (loadingState) {
//       if (loadingState.s !== 'l') {
//         dependencies.push(loadingState);
//       }
//       continue;
//     }

//     // We construct our new resource element, looping over remaining attributes if any
//     // setting them to the Element.
//     resourceEl = thisDocument.createElement("link");
//     resourceEl.href = href;
//     resourceEl.rel = 'stylesheet';
//     resourceEl.dataset.rprec = precedence = style[j++];
//     while(attr = style[j++]) {
//       resourceEl.setAttribute(attr, style[j++]);
//     }

//     // We stash a pending promise in our map by href which will resolve or reject
//     // when the underlying resource loads or errors. We add it to the dependencies
//     // array to be returned.
//     loadingState = resourceEl._p = new Promise((re, rj) => {
//       resourceEl.onload = re;
//       resourceEl.onerror = rj;
//     })
//     loadingState.then(
//       setStatus.bind(loadingState, LOADED),
//       setStatus.bind(loadingState, ERRORED)
//     );
//     resourceMap.set(href, loadingState);
//     dependencies.push(loadingState);

//     // The prior style resource is the last one placed at a given
//     // precedence or the last resource itself which may be null.
//     // We grab this value and then update the last resource for this
//     // precedence to be the inserted element, updating the lastResource
//     // pointer if needed.
//     let prior = precedences.get(precedence) || lastResource;
//     if (prior === lastResource) {
//       lastResource = resourceEl
//     }
//     precedences.set(precedence, resourceEl)

//     // Finally, we insert the newly constructed instance at an appropriate location
//     // in the Document.
//     if (prior) {
//       prior.parentNode.insertBefore(resourceEl, prior.nextSibling);
//     } else {
//       let head = thisDocument.head;
//       head.insertBefore(resourceEl, head.firstChild);
//     }
//   }

//   Promise.all(dependencies).then(
//     completeBoundary.bind(null, suspenseBoundaryID, contentID, ''),
//     completeBoundary.bind(null, suspenseBoundaryID, contentID, "Resource failed to load")
//   );
// }

// TODO: Generate this file with a build step.
export default '$RM=new Map;function $RR(p,q,t){function r(l){this.s=l}for(var m=new Map,n=document,g,e,f=n.querySelectorAll("link[data-rprec]"),d=0;e=f[d++];)m.set(e.dataset.rprec,g=e);e=0;f=[];for(var c,h,b,a;c=t[e++];){var k=0;h=c[k++];if(b=$RM.get(h))"l"!==b.s&&f.push(b);else{a=n.createElement("link");a.href=h;a.rel="stylesheet";for(a.dataset.rprec=d=c[k++];b=c[k++];)a.setAttribute(b,c[k++]);b=a._p=new Promise(function(l,u){a.onload=l;a.onerror=u});b.then(r.bind(b,"l"),r.bind(b,"e"));$RM.set(h,b);f.push(b);c=m.get(d)||g;c===g&&(g=a);m.set(d,a);c?c.parentNode.insertBefore(a,c.nextSibling):(d=n.head,d.insertBefore(a,d.firstChild))}}Promise.all(f).then($RC.bind(null,p,q,""),$RC.bind(null,p,q,"Resource failed to load"))}';
