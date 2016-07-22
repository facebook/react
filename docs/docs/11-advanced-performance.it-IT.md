---
id: advanced-performance-it-IT
title: Performance Avanzata
permalink: docs/advanced-performance-it-IT.html
prev: perf-it-IT.html
---

Una tra le prime domande che la gente si pone quando considera React per un progetto è se l'applicazione sarà altrettanto veloce e scattante di una versione equivalente non basata su React. L'idea di ripetere il rendering di un intero sottoalbero di componenti in risposta a ciascun cambiamento dello stato rende la gente curiosa se questo processo influisce negativamente sulle prestazioni. React utilizza diverse tecniche intelligenti per minimizzare il numero di operazioni costose sul DOM richieste dall'aggiornamento della UI.

## Evitare di riconciliare il DOM

React fa uso di un *DOM virtuale*, che è un descrittore di un sottoalbero DOM visualizzato nel browser. Questa rappresentazione parallela permette a React di evitare di creare nodi DOM e accedere nodi esistenti, che è di gran lunga più lento di operazioni su oggetti JavaScript. Quando le proprietà di un componente o il suo stato cambiano, React decide se un'aggiornamento effettivo del DOM sia necessario costruendo un nuovo virtual DOM e confrontandolo con quello vecchio. Solo nel caso in cui non siano uguali, React [riconcilierà](/react/docs/reconciliation.html) il DOM, applicando il minor numero di mutamenti possibile.

In aggiunta a questo, React offre una funzione per il ciclo di vita del componente, `shouldComponentUpdate`, che viene scatenata prima che il processo di ri-rendering cominci (il confronto del DOM virtuale e una possibile eventuale riconciliazione del DOM), dando allo sviluppatore la possibilità di cortocircuitare questo processo. L'implementazione predefinita di questa funzione restituisce `true`, lasciando che React effettui l'aggiornamento:

```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  return true;
}
```

Tieni in mente che React invocherà questa funzione abbastanza spesso, quindi l'implementazione deve essere veloce.

Supponiamo che hai un'applicazione di messaggistica con parecchi thread di conversazioni. Supponi che solo uno dei thread sia cambiato.  Se implementassimo `shouldComponentUpdate` sul componente `ChatThread`, React potrebbe saltare la fase di rendering per gli altri thread:

```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  // TODO: restituisci true se il thread attuale è diverso
  // da quello precedente.
}
```

Quindi, riassumendo, React evita di effettuare operazioni costose sul DOM richieste a riconciliare sottoalberi del DOM, permettendo all'utente di cortocircuitare il processo usando `shouldComponentUpdate`, e, per i casi in cui si debba aggiornare, confrontando i DOM virtuali.

## shouldComponentUpdate in azione

Ecco un sottoalbero di componenti. Per ciascuno di essi viene indicato cosa `shouldComponentUpdate` ha restituito e se i DOM virtuali siano equivalenti o meno. Infine, il colore del cerchio indica se il componente sia stato riconciliato o meno.

<figure><img src="/react/img/docs/should-component-update.png" /></figure>

Nell'esempio precedente, dal momento che `shouldComponentUpdate` ha restituito `false` per il sottoalbero di radice C2, React non ha avuto bisogno di generare il nuovo DOM virtuale, e quindi non ha nemmeno avuto bisogno di riconciliare il DOM. Nota che React non ha nemmeno avuto bisogno di invocare `shouldComponentUpdate` su C4 e C5.

Per C1 e C3, `shouldComponentUpdate` ha restituito `true`, quindi React è dovuto scendere giù fino alle foglie e controllarle. Per C6 ha restituito `true`; dal momento che i DOM virtuali non erano equivalenti, ha dovuto riconciliare il DOM.
L'ultimo caso interessante è C8. Per questo nodo React ha dovuto calcolare il DOM virtuale, ma dal momento che era uguale al vecchio, non ha dovuto riconciliare il suo DOM.

Nota che React ha dovuto effettuare mutazioni del DOM soltanto per C6, che era inevitabile. Per C8, lo ha evitato confrontando i DOM virtuali, e per il sottoalbero di C2 e C7, non ha neppure dovuto calcolare il DOM virtuale in quanto è stato esonerato da `shouldComponentUpdate`.

Quindi, come dovremmo implementare `shouldComponentUpdate`? Supponiamo di avere un componente che visualizza soltanto un valore stringa:

```javascript
React.createClass({
  propTypes: {
    value: React.PropTypes.string.isRequired
  },

  render: function() {
    return <div>{this.props.value}</div>;
  }
});
```

Potremmo facilmente implementare `shouldComponentUpdate` come segue:

```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  return this.props.value !== nextProps.value;
}
```

Finora tutto a posto, maneggiare queste semplici strutture proprietà e stato è molto facile. Potremmo anche generalizzare un'implementazione basata sull'uguaglianza superficiale e farne il mix dentro i componenti. Infatti, React fornisce già una tale implementazione: [PureRenderMixin](/react/docs/pure-render-mixin.html).

Ma che succede se le proprietà o lo stato del tuo componente sono strutture dati mutevoli? Supponiamo che la proprietà che il componente riceve sia, anziché una stringa come `'bar'`, un oggetto JavaScript che contiene una stringa, come `{ foo: 'bar' }`:

```javascript
React.createClass({
  propTypes: {
    value: React.PropTypes.object.isRequired
  },

  render: function() {
    return <div>{this.props.value.foo}</div>;
  }
});
```

L'implementazione di `shouldComponentUpdate` che avevamo prima non funzionerebbe sempre come ci aspettiamo:

```javascript
// assumiamo che this.props.value sia { foo: 'bar' }
// assumiamo che nextProps.value sia { foo: 'bar' },
// ma questo riferimento è diverso da this.props.value
this.props.value !== nextProps.value; // true
```

Il problema è che `shouldComponentUpdate` restituirà `true` quando la proprietà non è in realtà cambiata. Per risolvere questo problema, potremmo proporre questa implementazione alternativa:

```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  return this.props.value.foo !== nextProps.value.foo;
}
```

In breve, abbiamo finito per effettuare un confronto in profondità per assicurarci di accorgerci correttamente dei cambiamenti. In termini di prestazioni, questo approccio è molto costoso. Non scala in quanto dovremmo scrivere codice diverso per valutare l'uguaglianza in profondità per ciascun modello. Inoltre, potrebbe anche non funzionare per nulla se non gestiamo correttamente i riferimenti agli oggetti. Supponiamo che il componente sia usato da un genitore:

```javascript
React.createClass({
  getInitialState: function() {
    return { value: { foo: 'bar' } };
  },

  onClick: function() {
    var value = this.state.value;
    value.foo += 'bar'; // ANTI-PATTERN!
    this.setState({ value: value });
  },

  render: function() {
    return (
      <div>
        <InnerComponent value={this.state.value} />
        <a onClick={this.onClick}>Click me</a>
      </div>
    );
  }
});
```

La prima volta che viene effettuato il rendering del componente interno, la sua proprietà value avrà il valore `{ foo: 'bar' }`. Se l'utente clicca l'ancora, lo stato del componente genitore sarà aggiornato a `{ value: { foo: 'barbar' } }`, scatenando il processo di ri-rendering sul componente interno, il quale riceverà `{ foo: 'barbar' }` come il nuovo valore della proprietà.

Il problema è che, dal momento che il genitore e il componente interno condividono un riferimento allo stesso oggetto, quando l'oggetto viene modificato nella riga 2 della funzione `onClick`, la proprietà che il componente interno possedeva cambierà anch'essa. Quindi, quando il processo di ri-rendering inizia, e `shouldComponentUpdate` viene invocato, `this.props.value.foo` sarà uguale a `nextProps.value.foo`, perché infatti, `this.props.value` si riferisce allo stesso oggetto di `nextProps.value`.

Di conseguenza, dal momento che non ci accorgiamo del cambiamento della proprietà e cortocircuitiamo il processo di ri-rendering, la UI non sarà aggiornata da `'bar'` a `'barbar'`.

## Immutable-js viene in nostro soccorso

[Immutable-js](https://github.com/facebook/immutable-js) è una libreria di collezioni JavaScript scritta da Lee Byron, che Facebook ha recentemente rilasciato come open source. Fornisce collezioni *immutabili e persistenti* attraverso *condivisione strutturale*. Vediamo cosa significano queste proprietà:

* *Immutabile*: una volta creata, una collezione non può essere alterata in un momento successivo.
* *Persistente*: nuove collezioni possono essere create da una collezione precedente e una mutazione come un assegnamento. La collezione originale è ancora valida dopo che la nuova collezione è stata creata.
* *Condivisione Strutturale*: nuove collezioni sono create riutilizzando quanto più possibile della stessa struttura della collezione originale, riducendo le operazioni di copia al minimo, per ottenere efficienza spaziale e prestazioni accettabili. Se la nuova collezione è identica all'originale, l'originale è spesso restituita.

L'immutabilità ci permette di tenere traccia dei cambiamenti in modo economico; un cambiamento risulterà sempre in un nuovo oggetto, quindi dobbiamo soltanto controllare se il riferimento all'oggeto sia cambiato. Ad esempio, in questo codice regolare JavaScript:

```javascript
var x = { foo: "bar" };
var y = x;
y.foo = "baz";
x === y; // true
```

Sebbene `y` sia stato modificato, dal momento che si tratta di un riferimento allo stesso oggetto di `x`, questo confronto restituisce `true`. Tuttavia, questo codice potrebbe essere scritto usando immutable-js come segue:

```javascript
var SomeRecord = Immutable.Record({ foo: null });
var x = new SomeRecord({ foo: 'bar'  });
var y = x.set('foo', 'baz');
x === y; // false
```

In questo caso, poiché un nuovo riferimento è restituito quando si modifica `x`, possiamo assumere in tutta sicurezza che `x` sia cambiato.

Un'altra maniera possibile di tener traccia dei cambiamenti potrebbe essere il dirty checking, ovvero usare un flag impostato dai metodi setter. Un problema con questo approccio è che ti forza ad usare i setter e scrivere un sacco di codice aggiuntivo, oppure instrumentare in qualche modo le tue classi. In alternativa, puoi effettuare una copia profonda dell'oggetto immediatamente prima della mutazione ed effettuare un confronto in profondità per determinare se vi è stato un cambiamento oppure no. Un problema con questo approccio è che sia deepCopy che deepCompare sono operazioni costose.

Quindi, le strutture dati Immutable ti forniscono una maniera economica e concisa di osservare i cambiamenti degli oggetti, che è tutto ciò che ci serve per implementare `shouldComponentUpdate`. Pertanto, se modelliamo gli attributi delle proprietà e dello stato usando le astrazioni fornite da immutable-js saremo in grado di usare `PureRenderMixin` e ottenere un grande aumento di prestazioni.

## Immutable-js e Flux

Se stai usando [Flux](https://facebook.github.io/flux/), dovresti cominciare a scrivere i tuoi store usando immutable-js. Dài un'occhiata alla [API completa](https://facebook.github.io/immutable-js/docs/#/).

Vediamo una delle possibili maniere di modellare l'esempio dei thread usando strutture dati Immutable. Anzitutto, dobbiamo definire un  `Record` per ciascuna delle entità che desideriamo modellare. I Record sono semplicemente contenitori immutabili che contengono valori per un insieme specifico di campi:

```javascript
var User = Immutable.Record({
  id: undefined,
  name: undefined,
  email: undefined
});

var Message = Immutable.Record({
  timestamp: new Date(),
  sender: undefined,
  text: ''
});
```

La funzione `Record` riceve un oggetto che definisce i campi che l'oggetto possiede e i loro valori predefiniti.

Lo *store* dei messaggi potrebbe tenere traccia degli utenti e dei messaggi usando due liste:

```javascript
this.users = Immutable.List();
this.messages = Immutable.List();
```

Dovrebbe essere abbastanza banale implementare funzioni che gestiscono ciascun tipo di *payload*. Ad esempio, quando lo store vede un payload che rappresenta un messaggio, possiamo semplicemente creare un nuovo record e metterlo in coda alla lista di messaggi:

```javascript
this.messages = this.messages.push(new Message({
  timestamp: payload.timestamp,
  sender: payload.sender,
  text: payload.text
});
```

Nota che dal momento che le strutture dati sono immutabili, dobbiamo assegnare il valore di ritorno del metodo push a `this.messages`.

Dal punto di vista di React, se usiamo strutture dati immutable-js anche per contenere lo stato del componente, possiamo fare il mix di `PureRenderMixin` in tutti i nostri componenti e cortocircuitare il processo di ri-rendering.
