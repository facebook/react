---
id: reusable-components-it-IT
title: Componenti Riutilizzabili
permalink: reusable-components-it-IT.html
prev: multiple-components-it-IT.html
next: transferring-props-it-IT.html
---

Quando disegni interfacce, separa gli elementi comuni di design (bottoni, campi dei moduli, componenti di layout, etc.) in componenti riutilizzabili con interfacce ben definite. In questo modo, la prossima volta che dovrai costruire una nuova UI, puoi scrivere molto meno codice. Ciò significa tempi di sviluppo più brevi, meno bachi, e meno byte trasferiti sulla rete.


## Validazione delle Proprietà

Mentre la tua applicazione cresce, è utile assicurarsi che i tuoi componenti vengano usati correttamente. Ciò viene fatto permettendoti di specificare i `propTypes`. `React.PropTypes` esporta una gamma di validatori che possono essere usati per assicurarsi che i dati che ricevi siano validi. Quando ad una proprietà è assegnato un valore non valido, sarà mostrato un avvertimento nella console JavaScript. Nota che per motivi di prestazioni, `propTypes` è utilizzato soltanto nella modalità di sviluppo. Di seguito trovi un esempio che documenta i diversi validatori che vengono forniti:

```javascript
React.createClass({
  propTypes: {
    // Puoi dichiarare che una proprietà è uno specifico tipo primitivo JS. In
    // maniera predefinita, questi sono tutti opzionali.
    optionalArray: React.PropTypes.array,
    optionalBool: React.PropTypes.bool,
    optionalFunc: React.PropTypes.func,
    optionalNumber: React.PropTypes.number,
    optionalObject: React.PropTypes.object,
    optionalString: React.PropTypes.string,

    // Tutto ciò che può essere mostrato: numeri, stringhe, elementi, o un array
    // (o frammento) contenente questi tipi.
    optionalNode: React.PropTypes.node,

    // Un elemento React.
    optionalElement: React.PropTypes.element,

    // Puoi anche dichiarare che una proprietà è un'istanza di una classe. Questo
    // validatore usa l'operatore instanceof di JS.
    optionalMessage: React.PropTypes.instanceOf(Message),

    // Puoi assicurarti che la tua proprietà sia ristretta a valori specifici
    // trattandoli come una enumerazione.
    optionalEnum: React.PropTypes.oneOf(['News', 'Photos']),

    // Un oggetto che può essere di uno tra diversi tipi
    optionalUnion: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number,
      React.PropTypes.instanceOf(Message)
    ]),

    // Un array di un tipo specificato
    optionalArrayOf: React.PropTypes.arrayOf(React.PropTypes.number),

    // Un oggetto con proprietà dai valori di un tipo specificato
    optionalObjectOf: React.PropTypes.objectOf(React.PropTypes.number),

    // Un oggetto che accetta una forma particolare
    optionalObjectWithShape: React.PropTypes.shape({
      color: React.PropTypes.string,
      fontSize: React.PropTypes.number
    }),

    // Puoi concatenare ciascuna delle precedenti con `isRequired` per assicurarti
    // che venga mostrato un avvertimento se la proprietà non viene impostata.
    requiredFunc: React.PropTypes.func.isRequired,

    // Un valore di un tipo qualsiasi
    requiredAny: React.PropTypes.any.isRequired,

    // Puoi inoltre specificare un validatore personalizzato. Deve restituire un
    // oggetto di tipo Error se la validazione fallisce. Non lanciare eccezioni
    // o utilizzare `console.warn`, in quanto non funzionerebbe all'interno di
    // `oneOfType`.
    customProp: function(props, propName, componentName) {
      if (!/matchme/.test(props[propName])) {
        return new Error('Validazione fallita!');
      }
    }
  },
  /* ... */
});
```


## Valori Predefiniti delle Proprietà

React ti permette di definire valori predefiniti per le tue `props` in una maniera molto dichiarativa:

```javascript
var ComponentWithDefaultProps = React.createClass({
  getDefaultProps: function() {
    return {
      value: 'valore predefinito'
    };
  }
  /* ... */
});
```

Il risultato di `getDefaultProps()` sarà conservato e usato per assicurarsi che `this.props.value` avrà sempre un valore se non è stato specificato dal componente proprietario. Ciò ti permette di utilizzare in sicurezza le tue proprietà senza dover scrivere codice fragile e ripetitivo per gestirlo da te.


## Trasferire le  Proprietà: Una Scorciatoia

Un tipo comune di componente React è uno che estende un elemento basico HTML in maniera semplice. Spesso vorrai copiare qualsiasi attributo HTML passato al tuo componente all'elemento HTML sottostante per risparmiare del codice. Puoi usare la sintassi _spread_ di JSX per ottenerlo:

```javascript
var CheckLink = React.createClass({
  render: function() {
    // Questo prende ciascuna proprietà passata a CheckLink e la copia su <a>
    return <a {...this.props}>{'√ '}{this.props.children}</a>;
  }
});

ReactDOM.render(
  <CheckLink href="/checked.html">
    Clicca qui!
  </CheckLink>,
  document.getElementById('example')
);
```

## Figlio Singolo

Con `React.PropTypes.element` puoi specificare che solo un figlio unico possa essere passato come figli ad un componente.

```javascript
var MyComponent = React.createClass({
  propTypes: {
    children: React.PropTypes.element.isRequired
  },

  render: function() {
    return (
      <div>
        {this.props.children} // Questo deve essere esattamente un elemento oppure lancerà un'eccezione.
      </div>
    );
  }

});
```

## Mixin

I componenti sono la maniera migliore di riutilizzare il codice in React, ma a volte componenti molto diversi possono condividere funzionalità comune. Questi sono a volte chiamate [responsabilità trasversali](https://en.wikipedia.org/wiki/Cross-cutting_concern). React fornisce i `mixin` per risolvere questo problema.

Un caso d'uso comune è un componente che desidera aggiornarsi ad intervalli di tempo. È facile usare `setInterval()`, ma è anche importante cancellare la chiamata ripetuta quando non è più necessaria per liberare memoria. React fornisce dei [metodi del ciclo di vita](/react/docs/working-with-the-browser.html#component-lifecycle) che ti permettono di sapere quando un componente sta per essere creato o distrutto. Creiamo un semplice mixin che usa questi metodi per fornire una facile funzione `setInterval()` che sarà automaticamente rimossa quando il tuo componente viene distrutto.

```javascript
var SetIntervalMixin = {
  componentWillMount: function() {
    this.intervals = [];
  },
  setInterval: function() {
    this.intervals.push(setInterval.apply(null, arguments));
  },
  componentWillUnmount: function() {
    this.intervals.forEach(clearInterval);
  }
};

var TickTock = React.createClass({
  mixins: [SetIntervalMixin], // Usa il mixin
  getInitialState: function() {
    return {seconds: 0};
  },
  componentDidMount: function() {
    this.setInterval(this.tick, 1000); // Chiama un metodo del mixin
  },
  tick: function() {
    this.setState({seconds: this.state.seconds + 1});
  },
  render: function() {
    return (
      <p>
        React has been running for {this.state.seconds} seconds.
      </p>
    );
  }
});

ReactDOM.render(
  <TickTock />,
  document.getElementById('example')
);
```

Una caratteristica interessante dei mixin è che, se un componente usa molteplici mixin e diversi mixin definiscono lo stesso metodo del ciclo di vita (cioè diversi mixin desiderano effettuare una pulizia quando il componente viene distrutto), viene garantito che tutti i metodi del ciclo di vita verranno chiamati. I metodi definiti nei mixin vengono eseguiti nell'ordine in cui i mixin sono elencati, seguiti da una chiamata al metodo definito nel componente.

## Classi ES6

Puoi anche definire le tue classi React come pure classi JavaScript. Per esempio, usando la sintassi delle classi ES6:

```javascript
class HelloMessage extends React.Component {
  render() {
    return <div>Ciao {this.props.name}</div>;
  }
}
ReactDOM.render(<HelloMessage name="Sebastian" />, mountNode);
```

L'API è simile a `React.createClass` con l'eccezione del metodo `getInitialState`. Anziché fornire un metodo `getInitialState` a parte, imposti la tua proprietà `state` nel costruttore.

Un'altra differenza è che `propTypes` e `defaultProps` sono definite come proprietà del costruttore anziché nel corpo della classe.

```javascript
export class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {count: props.initialCount};
  }
  tick() {
    this.setState({count: this.state.count + 1});
  }
  render() {
    return (
      <div onClick={this.tick.bind(this)}>
        Click: {this.state.count}
      </div>
    );
  }
}
Counter.propTypes = { initialCount: React.PropTypes.number };
Counter.defaultProps = { initialCount: 0 };
```

### Niente Binding Automatico

I metodi seguono la stessa semantica delle classi ES6 regolari, ciò significa che non effettuano il binding automatico di `this` all'istanza. Dovrai pertanto usare esplicitamente `.bind(this)` oppure [le funzioni freccia](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions) `=>`.

### Niente Mixin

Sfortunatamente, ES6 è stato lanciato senza alcun supporto per i mixin. Di conseguenza non vi è alcun supporto per i mixin quando usi React con le classi ES6. Stiamo lavorando per rendere più semplice il supporto dei relativi casi d'uso senza ricorrere ai mixin.



## Funzioni Prive di Stato

Puoi anche definire le tue classi React come semplici funzioni JavaScript. Ad esempio usando la sintassi della funzione priva di stato:

```javascript
function HelloMessage(props) {
  return <div>Ciao {props.name}</div>;
}
ReactDOM.render(<HelloMessage name="Sebastian" />, mountNode);
```

Oppure usando la nuova sintassi freccia di ES6:

```javascript
const HelloMessage = (props) => <div>Ciao {props.name}</div>;
ReactDOM.render(<HelloMessage name="Sebastian" />, mountNode);
```


Questa API semplificata dei componenti è intesa per i componenti che sono pure funzioni dele proprietà. Questi componenti non devono trattenere stato interno, non hanno istanze di supporto, e non posseggono metodi di ciclo di vita. Sono pure trasformate funzionali del loro input, con zero codice boilerplate.

> NOTA:
>
> Poiché le funzioni prive di stato non hanno un'istanza di supporto, non puoi assegnare un ref a un componente creato con una funzione priva di stato. Normalmente questo non è un problema, poiché le funzioni prive di stato non forniscono un'API imperativa. Senza un'API imperativa, non puoi comunque fare molto con un'istanza. Tuttavia, se un utente desidera trovare il nodo DOM di un componente creato con una funzione priva di stato, occorre avvolgere il componente in un altro componente dotato di stato (ad es. un componente classe ES6) e assegnare il ref al componente dotato di stato.

In un mondo ideale, la maggior parte dei tuoi componenti sarebbero funzioni prive di stato poiché questi componenti privi di stato seguono un percorso più rapido all'interno del core di React. Questo è un pattern raccomandato, quando possibile.
