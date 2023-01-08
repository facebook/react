// This is a generated file. The source files are in react-dom-bindings/src/server/fizz-instruction-set.
// The build script is at scripts/rollup/generate-inline-fizz-runtime.js.
// Run `yarn generate-inline-fizz-runtime` to generate.
export const clientRenderBoundary =
  '$RX=function(b,c,d,e){var a=document.getElementById(b);a&&(b=a.previousSibling,b.data="$!",a=a.dataset,c&&(a.dgst=c),d&&(a.msg=d),e&&(a.stck=e),b._reactRetry&&b._reactRetry())};';
export const completeBoundary =
  '$RC=function(b,c,e){c=document.getElementById(c);c.parentNode.removeChild(c);var a=document.getElementById(b);if(a){b=a.previousSibling;if(e)b.data="$!",a.setAttribute("data-dgst",e);else{e=b.parentNode;a=b.nextSibling;var f=0;do{if(a&&8===a.nodeType){var d=a.data;if("/$"===d)if(0===f)break;else f--;else"$"!==d&&"$?"!==d&&"$!"!==d||f++}d=a.nextSibling;e.removeChild(a);a=d}while(a);for(;c.firstChild;)e.insertBefore(c.firstChild,a);b.data="$"}b._reactRetry&&b._reactRetry()}};';
export const completeBoundaryWithStyles =
  '$RM=new Map;\n$RR=function(g,q,r,v){function t(m){this.s=m}g=window[g?"$RK":"$RC"];for(var u=$RM,n=new Map,p=document,h,e,f=p.querySelectorAll("link[data-precedence],style[data-precedence]"),d=0;e=f[d++];)n.set(e.dataset.precedence,h=e);e=0;f=[];for(var c,k,b,a;c=v[e++];){var l=0;k=c[l++];if(b=u.get(k))"l"!==b.s&&f.push(b);else{a=p.createElement("link");a.href=k;a.rel="stylesheet";for(a.dataset.precedence=d=c[l++];b=c[l++];)a.setAttribute(b,c[l++]);b=a._r=new Promise(function(m,w){a.onload=m;a.onerror=\nw});b.then(t.bind(b,"l"),t.bind(b,"e"));u.set(k,b);f.push(b);c=n.get(d)||h;c===h&&(h=a);n.set(d,a);c?c.parentNode.insertBefore(a,c.nextSibling):(d=p.head,d.insertBefore(a,d.firstChild))}}Promise.all(f).then(g.bind(null,q,r,""),g.bind(null,q,r,"Stylesheet failed to load"))};';
export const completeSegment =
  '$RS=function(a,b){a=document.getElementById(a);b=document.getElementById(b);for(a.parentNode.removeChild(a);a.firstChild;)b.parentNode.insertBefore(a.firstChild,b);b.parentNode.removeChild(b)};';
export const completeContainer =
  '$RK=function(a,e){var b=document;try{var c=b.getElementById(e);c.parentNode.removeChild(c);var d=b.getElementById(a);if(d)for(d.textContent="";c.firstChild;)d.appendChild(c.firstChild)}finally{if(a=b.getElementById("bs:"+e))b.body.appendChild(a.content),a.parentNode.removeChild(a)}};';
