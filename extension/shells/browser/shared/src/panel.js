// Portal target container.
window.container = document.getElementById('container');

let hasInjectedStyles = false;

// DevTools styles are injected into the top-level document head (where the main React app is rendered).
// This method copies those styles to the child window where each panel (e.g. Elements, Profiler) is portaled.
window.injectStyles = getLinkTags => {
  if (!hasInjectedStyles) {
    hasInjectedStyles = true;

    const linkTags = getLinkTags();

    for (let linkTag of linkTags) {
      document.head.appendChild(linkTag);
    }
  }
};
