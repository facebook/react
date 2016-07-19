---
id: working-with-the-browser-it-IT
title: Lavorare con il Browser
permalink: docs/working-with-the-browser-it-IT.html
prev: forms-it-IT.html
next: more-about-refs-it-IT.html
---

React offre potenti astrazioni che ti liberano in molti casi dal compito di manipolare direttamente il DOM, ma a volte potresti avere bisogno di accedere alle API sottostanti, ad esempio per lavorare con una libreria di terze parti o altro codice preesistente.


## Il DOM Virtuale

React è così veloce perché non interagisce direttamente con il DOM. React gestisce una rappresentazione veloce del DOM in memoria. I metodi `render()` restituiscono una *descrizione* del DOM, e React può confrontare questa descrizione con la rappresentazione in memoria per calcolare la maniera più veloce di aggiornare il browser.

In aggiunta, React implementa un intero sistema di eventi sintetici che fa in modo che tutti gli oggetti evento siano conformi alle specifiche W3C nonostante le incompatibilità dei browser, e ciascun evento si propaga in maniera consistente ed efficiente in ogni browser. Puoi anche utilizzare alcuni eventi HTML5 in IE8!

Nella maggior parte dei casi è sufficiente rimanere nel mondo del "browser fittizio" di React poiché più efficiente e facile da concepire. Tuttavia, a volte potresti aver bisogno di accedere alle API sottostanti, ad esempio per lavorare con una libreria di terze parti come un plugin jQuery. React fornisce convenienti vie di fuga perché tu possa utilizzare direttamente le API DOM sottostanti.


## I Ref e findDOMNode()

Per interagire con il browser, avrai bisogno di un riferimento a un nodo DOM. Puoi assegnare un attributo `ref` a ciascun elemento, ciò ti permette di fare riferimento all'**istanza di supporto** del componente. Questo è utile se devi invocare funzioni imperative sul componente, oppure desideri accedere ai nodi DOM sottostanti. Per saperne di piu sui ref, incluso la maniera di usarli con efficacia, leggi la nostra documentazione [riferimenti a componenti](/react/docs/more-about-refs-it-IT.html).


## Ciclo di Vita del Componente

I componenti hanno tree fasi principali del ciclo di vita:

* **Montaggio:** Un componente sta venendo inserito nel DOM.
* **Aggiornamento:** Viene effettuato nuovamente il rendering del componente per determinare se il DOM vada aggiornato.
* **Smontaggio:** Un componente sta venendo rimosso dal DOM.

React offre metodi del ciclo di vita che puoi specificare per inserirti in questo processo. Offriamo dei metodi il cui nome inizia per **will**, chiamati immediatamente prima che qualcosa accada, o per **did** che sono chiamati immediatamente dopo che qualcosa è accaduto.


### Montaggio

* `getInitialState(): object` è invocato prima che un componente viene montato. Componenti dotati di stato dovrebbero implementare questo metodo e restituire lo stato iniziale.
* `componentWillMount()` è invocato immediatamente prima che si effettui il montaggio.
* `componentDidMount()` è invocato immediatamente dopo che il montaggio è avvenuto. L'inizializzazione che richiede l'esistenza di nodi DOM dovrebbe avvenire in questo metodo.


### Aggiornamento

* `componentWillReceiveProps(object nextProps)` è invocato quando un componente montato riceve nuove proprietà. Questo metodo dovrebbe essere utilizzato per confrontare `this.props` e `nextProps` per effettuare transizioni di stato utilizzando `this.setState()`.
* `shouldComponentUpdate(object nextProps, object nextState): boolean` è invocato quando un componente decide se i cambiamenti debbano risultare in un aggiornamento del DOM. Implementa questo metodo come un'ottimizzazione per confrontare `this.props` con `nextProps` e `this.state` con `nextState`, e restituisci `false` se React debba rimandare l'aggiornamento.
* `componentWillUpdate(object nextProps, object nextState)` è invocato immediatamente prima che l'aggiornamento avvenga. Non puoi chiamare `this.setState()` al suo interno.
* `componentDidUpdate(object prevProps, object prevState)` è invocato immediatamente dopo che l'aggiornamento è avvenuto.


### Smontaggio

* `componentWillUnmount()` è invocato immediatamente prima che un componente venga smontato e distrutto. Puoi effettuare operazioni di pulizia al suo interno.


### Metodi Montati

Componenti compositi _montati_ supportano anche i seguenti metodi:

* `findDOMNode(): DOMElement` può essere invocato su ciascun componente montato per ottenere un riferimento al suo nodo DOM.
* `forceUpdate()` può essere invocato su ciascun componente montato quando si è certi che un aspetto interno del componente è cambiato senza usare `this.setState()`.


## Supporto per i Browser e Polyfill

A Facebook supportiamo vecchi browser, incluso IE8. Abbiamo impiegato per un lungo tempo i polyfill per consentirci di scrivere JS con un occhio al futuro. Ciò significa che non abbiamo una quantità di hack sparsi nel nostro codice e possiamo tuttavia aspettarci che il nostro codice "semplicemente funzioni". Ad esempio, anziché usare `+new Date()`, possiamo scrivere `Date.now()`. Dal momento che la versione open source di React è la stessa che usiamo internamente, vi abbiamo applicato la stessa filosofia di scrivere JS guardando avanti.

In aggiunta a questa filosofia, abbiamo anche deciso, in qualità di autori di una libreria JS, non dovremmo fornire i polyfill assieme alla nostra libreria. Se ciascuna libreria facesse ciò, con buona probabilità invieresti lo stesso polyfill diverse volte, cosa che potrebbe risultare in una rilevante quantità di codice inutilizzato. Se il tuo prodotto deve supportare vecchi browser, con buona probabilità stai già usando qualcosa come [es5-shim](https://github.com/es-shims/es5-shim).


### Polyfill Richiesti per Supportare Vecchi Browser

`es5-shim.js` tratto da [es5-shim di kriskowal](https://github.com/es-shims/es5-shim) fornisce le seguenti API indispensabili a React:

* `Array.isArray`
* `Array.prototype.every`
* `Array.prototype.forEach`
* `Array.prototype.indexOf`
* `Array.prototype.map`
* `Date.now`
* `Function.prototype.bind`
* `Object.keys`
* `String.prototype.split`
* `String.prototype.trim`

`es5-sham.js`, anch'esso tratto da [es5-shim di kriskowal](https://github.com/es-shims/es5-shim), provides the following that React needs:

* `Object.create`
* `Object.freeze`

La build non minificata di React richiede le seguenti API tratte da [console-polyfill di paulmillr](https://github.com/paulmillr/console-polyfill).

* `console.*`

Quando si usano elementi HTML5 in IE8 incluso `<section>`, `<article>`, `<nav>`, `<header>` e `<footer>`, è inoltre necessario includere [html5shiv](https://github.com/aFarkas/html5shiv) o uno script equivalente.


### Problemi Cross-browser

Nonostante React sia molto buono ad astrarre le differenze tra browser, alcuni browser sono limitati o presentano comportamenti scorretti per i quali non abbiamo potuto trovare un rimedio.


#### Evento onScroll su IE8

Su IE8 l'evento `onScroll` non viene propagato, e IE8 non possiede una API per definire gestori di eventi nella fase di cattura dell'evento, con il risultato che React non ha alcun modo di reagire a questi eventi.
Al momento i gestori di questo evento vengono ignorati su IE8.

Leggi la issue [onScroll doesn't work in IE8](https://github.com/facebook/react/issues/631) su GitHub per maggiori informazioni.
