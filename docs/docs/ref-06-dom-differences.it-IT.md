---
id: dom-differences-it-IT
title: Differenze del DOM
permalink: dom-differences-it-IT.html
prev: events-it-IT.html
next: special-non-dom-attributes-it-IT.html
---

React ha implementato eventi indipendenti dal browser e un sistema DOM per ragioni di prestazioni e compatibilità cross-browser. Abbiamo colto l'occasione di dare una ripulita ad alcuni aspetti trascurati nelle implementazioni del DOM nei browser.

* Tutte le proprietà e attributi del DOM (incluso i gestori di eventi) dovrebbero essere camelCased per essere consistenti con lo stile standard JavaScript. Abbiamo intenzionalmente deviato dalla specifica perché la specifica stessa è inconsistente. **Tuttavia**, gli attributi `data-*` e `aria-*` [sono conformi alle specifiche](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes#data-*) e dovrebbero essere soltanto in minuscolo.
* L'attributo `style` accetta un oggetto JavaScript con proprietà camelCased anziché una stringa CSS. Questo è consistente con la proprietà DOM `style` di JavaScript, è più efficiente, e previene falle nella sicurezza XSS.
* Tutti gli oggetti evento sono conformi con la specifica W3C, e tutti gli eventi (incluso il submit) si propagano correttamente secondo la specifica W3C. Consulta il [Sistema degli Eventi](/react/docs/events.html) per maggiori dettagli.
* L'evento `onChange` si comporta come ti aspetteresti: questo evento è emesso ogni qualvolta il valore di un campo di un modulo cambia anziché, in maniera inconsistente, quando il campo perde il focus. Abbiamo intenzionalmente deviato dal comportamento corrente dei browser perché `onChange` è un nome incorretto per questo comportamento e React dipende dall'emissione di questo evento in tempo reale in risposta all'input dell'utente. Leggi [Moduli](/react/docs/forms.html) per maggiori dettagli.
* Attributi dei campi di modulo come `value` e `checked`, oppure `textarea`. [Maggiori dettagli](/react/docs/forms.html).
