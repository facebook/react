// This is a generated file. The source files are in react-dom-bindings/src/server/fizz-instruction-set.
// The build script is at scripts/rollup/generate-inline-fizz-runtime.js.
// Run `yarn generate-inline-fizz-runtime` to generate.
export const markShellTime =
  'requestAnimationFrame(function(){$RT=performance.now()});';
export const clientRenderBoundary =
  '$RX=function(b,c,d,e,f){var a=document.getElementById(b);a&&(b=a.previousSibling,b.data="$!",a=a.dataset,c&&(a.dgst=c),d&&(a.msg=d),e&&(a.stck=e),f&&(a.cstck=f),b._reactRetry&&b._reactRetry())};';
export const completeBoundary =
  '$RB=[];\n$RC=function(d,a){if(a=document.getElementById(a))if(a.parentNode.removeChild(a),d=document.getElementById(d))for($RB.push(d,a),d=$RB,$RB=[],a=0;a<d.length;a+=2){var b=d[a],h=d[a+1],e=b.parentNode;if(e){var f=b.previousSibling,g=0;do{if(b&&8===b.nodeType){var c=b.data;if("/$"===c||"/&"===c)if(0===g)break;else g--;else"$"!==c&&"$?"!==c&&"$!"!==c&&"&"!==c||g++}c=b.nextSibling;e.removeChild(b);b=c}while(b);for(;h.firstChild;)e.insertBefore(h.firstChild,b);f.data="$";f._reactRetry&&\nf._reactRetry()}}};';
export const completeBoundaryWithStyles =
  '$RM=new Map;\n$RR=function(r,v,w){function t(n){this._p=null;n()}for(var p=new Map,q=document,g,b,h=q.querySelectorAll("link[data-precedence],style[data-precedence]"),u=[],k=0;b=h[k++];)"not all"===b.getAttribute("media")?u.push(b):("LINK"===b.tagName&&$RM.set(b.getAttribute("href"),b),p.set(b.dataset.precedence,g=b));b=0;h=[];var l,a;for(k=!0;;){if(k){var e=w[b++];if(!e){k=!1;b=0;continue}var c=!1,m=0;var d=e[m++];if(a=$RM.get(d)){var f=a._p;c=!0}else{a=q.createElement("link");a.href=d;a.rel=\n"stylesheet";for(a.dataset.precedence=l=e[m++];f=e[m++];)a.setAttribute(f,e[m++]);f=a._p=new Promise(function(n,x){a.onload=t.bind(a,n);a.onerror=t.bind(a,x)});$RM.set(d,a)}d=a.getAttribute("media");!f||d&&!matchMedia(d).matches||h.push(f);if(c)continue}else{a=u[b++];if(!a)break;l=a.getAttribute("data-precedence");a.removeAttribute("media")}c=p.get(l)||g;c===g&&(g=a);p.set(l,a);c?c.parentNode.insertBefore(a,c.nextSibling):(c=q.head,c.insertBefore(a,c.firstChild))}Promise.all(h).then($RC.bind(null,\nr,v),$RX.bind(null,r,"CSS failed to load"))};';
export const completeSegment =
  '$RS=function(a,b){a=document.getElementById(a);b=document.getElementById(b);for(a.parentNode.removeChild(a);a.firstChild;)b.parentNode.insertBefore(a.firstChild,b);b.parentNode.removeChild(b)};';
export const formReplaying =
  'addEventListener("submit",function(a){if(!a.defaultPrevented){var c=a.target,d=a.submitter,e=c.action,b=d;if(d){var f=d.getAttribute("formAction");null!=f&&(e=f,b=null)}"javascript:throw new Error(\'React form unexpectedly submitted.\')"===e&&(a.preventDefault(),b?(a=document.createElement("input"),a.name=b.name,a.value=b.value,b.parentNode.insertBefore(a,b),b=new FormData(c),a.parentNode.removeChild(a)):b=new FormData(c),a=c.ownerDocument||c,(a.$$reactFormReplay=a.$$reactFormReplay||[]).push(c,d,b))}});';
