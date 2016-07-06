---
id: special-non-dom-attributes-it-IT
title: Attributi Speciali Non-DOM
permalink: special-non-dom-attributes-it-IT.html
prev: dom-differences-it-IT.html
next: reconciliation-it-IT.html
---

Oltre alle [Differenze del DOM](/react/docs/dom-differences.html), React offre alcuni attributi che semplicemente non esistono nel DOM.

- `key`: un identificatore univoco opzionale. Quando il tuo componente viene riordinato durante i passaggi di `render`, potrebbe essere distrutto e ricreato in base all'algoritmo di calcolo delle differenze. Assegnargli una chiave che persiste assicura che il componente venga preservato. Scopri maggiori dettagli [qui](/react/docs/multiple-components.html#dynamic-children).
- `ref`: leggi [qui](/react/docs/more-about-refs.html).
- `dangerouslySetInnerHTML`: Offre l'abilità di inserire HTML grezzo, principalmente per cooperare con librerie di manipolazione di stringhe DOM. Scopri maggiori dettagli [qui](/react/tips/dangerously-set-inner-html.html).
