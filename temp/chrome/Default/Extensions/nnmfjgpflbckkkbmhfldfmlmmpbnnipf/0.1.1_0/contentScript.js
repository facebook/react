/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @flow strict-local
 * @fbt {"project":"do-not-translate"}
 */

// Wiki page links
const wikiPageContentElement = document.getElementById('wiki-page-editor-content');
const wikiHomePageElement = document.getElementById("wiki-home-page");
const wikiPageContentlinks = wikiPageContentElement?.getElementsByTagName('a')??[];
const wikiHomePagelinks = wikiHomePageElement?.getElementsByTagName('a')??[];

const links = [...wikiPageContentlinks, ...wikiHomePagelinks];
let domain = "internalfb.com";
const shimmedURIPrefix = 'https://l.facebook.com/l.php?u=';
for (let i = 0, l = links.length; i < l; i++) {
  let url = links[i].href;
  let decodedURI = url;
  if(url.indexOf(shimmedURIPrefix)>-1){
    decodedURI = decodeURIComponent(url.replace(shimmedURIPrefix, ""));
  }
  if(decodedURI === '#' || decodedURI.includes(window.location.href + "#") || decodedURI.includes("internalfb.com/intern/wiki/_download")){
    // Ignore links which are pointing to self or a download link
    continue;
  }
  if(decodedURI.includes("internalfb.com/intern/wiki/")){
    // WIKI
    const hovercardUrl = url.replace("internalfb.com/intern/wiki/", domain.concat("/intern/wiki/sl/hovercard/"));
    links[i].setAttribute("data-hovercard", hovercardUrl);
  } else if(decodedURI.includes("docs.google.com")){
    // Google Suite apps
    const hovercardUrl = "https://www.".concat(domain).concat("/intern/gsuite/sl/hovercard/").concat(url);
    links[i].setAttribute("data-hovercard", hovercardUrl);
  } else if(decodedURI.includes("fb.workplace.com/notes")){
    // Notes
    const hovercardUrl = "https://www.".concat(domain).concat("/intern/notes/sl/hovercard/").concat(url);
    links[i].setAttribute("data-hovercard", hovercardUrl);
  }
}
