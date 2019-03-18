window.container = document.getElementById('container');

let hasInjectedStyles = false;

window.injectStyles = getLinkTags => {
  if (!hasInjectedStyles) {
    hasInjectedStyles = true;

    const linkTags = getLinkTags();

    for (let linkTag of linkTags) {
      document.head.appendChild(linkTag);
    }
  }
};
