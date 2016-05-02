---
id: tooling-integration-it-IT
title: Integrazione con Strumenti
permalink: docs/tooling-integration-it-IT.html
prev: more-about-refs-it-IT.html
next: addons-it-IT.html
---

Ciascun progetto utilizza un sistema differente per la build e il deploy di JavaScript. Abbiamo provato a rendere React il più possibile  indipendente dall'ambiente di sviluppo.

## React

### React hosted su un CDN

Offriamo versioni di React su CDN [nella nostra pagina dei download](/react/downloads.html). Questi file precompilati usano il formato dei moduli UMD. Inserirli con un semplice tag `<script>` inietterà una variabile globale `React` nel tuo ambiente. Questo approccio dovrebbe funzionare senza alcuna configurazione in ambienti CommonJS ed AMD.


### Usare il ramo master

Abbiamo istruzioni per compilare dal ramo `master` [nel nostro repositorio GitHub](https://github.com/facebook/react). Costruiamo un albero di moduli CommonJS sotto `build/modules` che puoi inserire in ogni ambiente o strumento di packaging che supporta CommonJS.

## JSX

### Trasformazione di JSX nel browser

Se preferisci usare JSX, Babel fornisce un [trasformatore ES6 e JSX nel browser per lo sviluppo](http://babeljs.io/docs/usage/browser/) chiamato browser.js che può essere incluso da una release npm `babel-core` oppure da [CDNJS](http://cdnjs.com/libraries/babel-core). Includi un tag `<script type="text/babel">` per scatenare il trasformatore JSX.

> Nota:
>
> Il trasformatore JSX nel browser è piuttosto grande e risulta in calcoli aggiuntivi lato client che possono essere evitati. Non utilizzare in produzione — vedi la sezione successiva.


### In Produzione: JSX Precompilato

Se hai [npm](https://www.npmjs.com/), puoi eseguire `npm install -g babel`. Babel include il supporto per React v0.12 e v0.13. I tag sono automaticamente trasformati negli equivalenti `React.createElement(...)`, `displayName` è automaticamente desunto e aggiunto a tutte le classi React.createClass.

Questo strumento tradurrà i file che usano la sintassi JSX a file in semplice JavaScript che possono essere eseguiti direttamente dal browser. Inoltre, osserverà le directory per te e trasformerà automaticamente i file quando vengono modificati; ad esempio: `babel --watch src/ --out-dir lib/`.

In maniera predefinita, vengono trasformati i file JSX con un'estensione `.js`. Esegui `babel --help` per maggiori informazioni su come usare Babel.

Output di esempio:

```
$ cat test.jsx
var HelloMessage = React.createClass({
  render: function() {
    return <div>Ciao {this.props.name}</div>;
  }
});

ReactDOM.render(<HelloMessage name="John" />, mountNode);
$ babel test.jsx
"use strict";

var HelloMessage = React.createClass({
  displayName: "HelloMessage",

  render: function render() {
    return React.createElement(
      "div",
      null,
      "Hello ",
      this.props.name
    );
  }
});

ReactDOM.render(React.createElement(HelloMessage, { name: "John" }), mountNode);
```


### Progetti Open Source Utili

La comunità open source ha creato strumenti che integrano JSX con diversi editor e sistemi di build. Consulta [integrazioni JSX ](https://github.com/facebook/react/wiki/Complementary-Tools#jsx-integrations) per una lista completa.
