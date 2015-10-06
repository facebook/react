---
id: displaying-data-it-IT
title: Visualizzare Dati
permalink: displaying-data-it-IT.html
prev: why-react-it-IT.html
next: jsx-in-depth-it-IT.html
---

L'attività più basilare che puoi effettuare con una UI è mostrare dei dati. React rende visualizzare dati semplice e mantiene automaticamente l'interfaccia aggiornata quando i dati cambiano.


## Per Cominciare

Diamo un'occhiata ad un esempio davvero semplice. Creiamo un file dal nome `hello-react.html` con il codice seguente:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Hello React</title>
    <script src="https://fb.me/react-{{site.react_version}}.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.23/browser.min.js"></script>
  </head>
  <body>
    <div id="example"></div>
    <script type="text/babel">

      // ** Il tuo codice va qui! **

    </script>
  </body>
</html>
```

Nel resto della documentazione, ci concentreremo soltanto sul codice JavaScript e assumeremo che sia inserito in un modello come quello qui sopra. Sostituisci il commento segnaposto qui sopra con il seguente codice JSX:

```javascript
var HelloWorld = React.createClass({
  render: function() {
    return (
      <p>
        Ciao, <input type="text" placeholder="Scrivi il tuo nome" />!
        È il {this.props.date.toTimeString()}
      </p>
    );
  }
});

setInterval(function() {
  ReactDOM.render(
    <HelloWorld date={new Date()} />,
    document.getElementById('example')
  );
}, 500);
```


## Aggiornamenti Reattivi

Apri `hello-react.html` in un browser web e scrivi il tuo nome nel campo di testo. Osserva che React cambia soltanto la stringa di testo dell'ora nella UI — ogni input che inserisci nel campo di testo rimane, anche se non hai scritto alcun codice che gestisce questo comportamento. React lo capisce da solo al tuo posto e fa la cosa giusta.

La maniera in cui siamo in grado di capirlo è che React non manipola il DOM a meno che non sia necessario. **Utilizza un DOM interno fittizio e veloce per effettuare confronti ed effettuare le mutazioni del DOM più efficienti al tuo posto.**

Gli input di questo componente sono chiamati `props` — breve per "properties". Sono passati come attributi nella sintassi JSX. Puoi pensare ad essi come immutabili nel contesto del componente, ovvero, **non assegnare mai `this.props`**.


## I Componenti Sono Come Funzioni

I componenti React sono molto semplici. Puoi immaginarli come semplici funzioni che ricevono in ingresso `props` e `state` (discusso in seguito) e rendono HTML. Fatta questa premessa, i componenti sono molto semplici da descrivere.

> Nota:
>
> **Una limitazione**: i componenti React possono rendere soltanto un singolo nodo radice. Se desideri restituire nodi multipli, essi *devono* essere avvolti in un singolo nodo radice.


## Sintassi JSX

Crediamo fermamente che i componenti sono la maniera corretta di separare i concetti anziché i "modelli" e la "logica di presentazione." Pensiamo che il markup e il codice che lo genera siano intimamente collegati. Inoltre, la logica di presentazione è solitamente molto complessa e usare un linguaggio di modello per esprimerla risulta dispendioso.

Abbiamo scoperto che la migliore soluzione a questo problema è generare HTML e un albero di componenti direttamente dal codice JavaScript in maniera da poter utilizzare tutta la potenza espressiva di un vero linguaggio di programmazione per costruire UI.

Per rendere il compito più facile, abbiamo aggiunto una semplice e **opzionale** sintassi simile all'HTML per creare questi nodi di albero React.

**JSX ti permette di creare oggetti JavaScript usando una sintassi HTML.** Per generare un collegamento in React usando puro JavaScript puoi scrivere:

`React.createElement('a', {href: 'https://facebook.github.io/react/'}, 'Ciao!')`

Con JSX ciò diventa:

`<a href="https://facebook.github.io/react/">Ciao!</a>`

Abbiamo scoperto che questo ha reso la costruzione di applicazioni React più semplice e i designer tendono a preferire la sintassi, ma ciascuno ha un diverso flusso di lavoro, quindi **JSX non è richiesto per utilizzare React.**

JSX è di dimensioni contenute. Per maggiori informazioni, consulta [JSX in profondità](/react/docs/jsx-in-depth-it-IT.html). Oppure osserva la trasformazione in tempo reale sulla [REPL di Babel](https://babeljs.io/repl/).

JSX è simile all'HTML, ma non proprio identico. Consulta la guida [JSX gotchas](/react/docs/jsx-gotchas-it-IT.html) per alcune differenze fondamentali.

[Babel offre una varietà di strumenti per cominciare a usare JSX](http://babeljs.io/docs/setup/), dagli strumenti a riga di comando alle integrazioni in Ruby on Rails. Scegli lo strumento che funziona meglio per te.


## React senza JSX

JSX è completamente opzionale; non è necessario utilizzare JSX con React. Puoi creare elementi React in puro JavaScript usando `React.createElement`, che richiede un nome di tag o di componente, un oggetto di proprietà e un numero variabile di argomenti che rappresentano nodi figli opzionali.

```javascript
var child1 = React.createElement('li', null, 'Primo Contenuto di Testo');
var child2 = React.createElement('li', null, 'Secondo Contenuto di Testo');
var root = React.createElement('ul', { className: 'my-list' }, child1, child2);
ReactDOM.render(root, document.getElementById('example'));
```

Per comodità, puoi creare funzioni factory scorciatoia per costruire elementi da componenti personalizzati.

```javascript
var Factory = React.createFactory(ComponentClass);
...
var root = Factory({ custom: 'prop' });
ReactDOM.render(root, document.getElementById('example'));
```

React possiede già delle factory predefinite per i tag HTML comuni:

```javascript
var root = React.DOM.ul({ className: 'my-list' },
             React.DOM.li(null, 'Contenuto di Testo')
           );
```
