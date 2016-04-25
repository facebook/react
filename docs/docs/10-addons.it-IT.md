---
id: addons-it-IT
title: Add-ons
permalink: docs/addons-it-IT.html
prev: tooling-integration-it-IT.html
next: animation-it-IT.html
---

`React.addons` è il luogo in cui parcheggiamo utili strumenti per costruire applicazioni React. **Questi strumenti devono essere considerati sperimentali** ma saranno eventualmente inclusi nel nucleo o una libreria ufficiale di utilities:

- [`TransitionGroup` e `CSSTransitionGroup`](animation-it-IT.html), per gestire animazioni e transizioni che sono solitamente difficili da implementare, come ad esempio prima della rimozione di un componente.
- [`LinkedStateMixin`](two-way-binding-helpers-it-IT.html), per semplificare la coordinazione tra lo stato del componente e l'input dell'utente in un modulo.
- [`cloneWithProps`](clone-with-props-it-IT.html), per eseguire una copia superficiale di componenti React e cambiare le loro proprietà.
- [`createFragment`](create-fragment-it-IT.html), per creare un insieme di figli con chiavi esterne.
- [`update`](update-it-IT.html), una funzione di utilità che semplifica la gestione di dati immutabili in JavaScript.
- [`PureRenderMixin`](pure-render-mixin-it-IT.html), un aiuto per incrementare le prestazioni in certe situazioni.

Gli add-ons elencati di seguito si trovano esclusivamente nella versione di sviluppo (non minificata) di React:

- [`TestUtils`](test-utils-it-IT.html), semplici helper per scrivere dei test case (soltanto nella build non minificata).
- [`Perf`](perf-it-IT.html), per misurare le prestazioni e fornirti suggerimenti per l'ottimizzazione.

Per ottenere gli add-on, usa `react-with-addons.js` (e la sua controparte non minificata) anziché il solito `react.js`.

Quandi si usa il pacchetto react di npm, richiedi semplicemente `require('react/addons')` anziché `require('react')` per ottenere React con tutti gli add-on.
