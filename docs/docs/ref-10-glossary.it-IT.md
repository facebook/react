---
id: glossary-it-IT
title: Terminologia del DOM (Virtuale)
permalink: docs/glossary-it-IT.html
prev: webcomponents.html
---

Nella terminologia di React, esistono cinque tipi base che è importante distinguere:

- [ReactElement / ReactElement Factory](#react-elements)
- [ReactNode](#react-nodes)
- [ReactComponent / ReactComponent Class](#react-components)

## Elementi React

Il tipo primario in React è il `ReactElement`. Possiede quattro proprietà: `type`, `props`, `key` e `ref`. Non possiede alcun metodo e non espone nulla sul prototype.

Puoi creare uno di questi oggetti attraverso `React.createElement`.

```javascript
var root = React.createElement('div');
```

Per effettuare il rendering di un nuovo albero nel DOM, crei dei `ReactElement` ande li passi a `ReactDOM.render` assieme a un `Element` DOM regolare (`HTMLElement` o `SVGElement`). I `ReactElement` non vanno confusi con gli `Element` del DOM. Un `ReactElement` è una rappresentazione leggera, priva di stato, immutabile e virtuale di un `Element` del DOM. È un DOM virtuale.

```javascript
ReactDOM.render(root, document.getElementById('example'));
```

Per aggiungere proprietà ad un elemento DOM, passa un oggetto di proprietà come secondo argomento, e i figli come terzo argomento.

```javascript
var child = React.createElement('li', null, 'Contenuto di Testo');
var root = React.createElement('ul', { className: 'my-list' }, child);
ReactDOM.render(root, document.getElementById('example'));
```

Se usi React JSX, allora questi `ReactElement` verranno creati per te. Questa espressione è equivalente:

```javascript
var root = <ul className="my-list">
             <li>Contenuto di Testo</li>
           </ul>;
ReactDOM.render(root, document.getElementById('example'));
```

### Le Factory

Una factory di `ReactElement` è semplicemente una funzione che genera un  `ReactElement` con una particolare proprietà `type`. React ha uno helper integrato per permetterti di creare factory. La sua implementazione è semplicemente:

```javascript
function createFactory(type) {
  return React.createElement.bind(null, type);
}
```

Ti permette di creare una conveniente scorciatoia anziché scrivere ogni volta `React.createElement('div')`.

```javascript
var div = React.createFactory('div');
var root = div({ className: 'my-div' });
ReactDOM.render(root, document.getElementById('example'));
```

React possiede già factory integrate per tag HTML comuni:

```javascript
var root = React.DOM.ul({ className: 'my-list' },
             React.DOM.li(null, 'Contenuto di Testo')
           );
```

Se stai usando JSX non hai bisogno di factory. JSX fornisce già una conveniente scorciatoia per creare `ReactElement`.


## Nodi React

Un `ReactNode` può essere uno tra:

- `ReactElement`
- `string` (ovvero `ReactText`)
- `number` (ovvero `ReactText`)
- Array di `ReactNode` (ovvero `ReactFragment`)

Questi sono usati come proprietà di altri `ReactElement` per rappresentare i figli. Effettivamente creano un albero di `ReactElement`.


## Componenti React

Puoi usare React usando soltanto `ReactElement`, ma per avvantaggiarti seriamente di  React vorrai usare i `ReactComponent` per creare incapsulamento con uno stato incluso.

Una classe `ReactComponent` è semplicemente una classe JavaScript (o una "funzione costruttore").

```javascript
var MyComponent = React.createClass({
  render: function() {
    ...
  }
});
```

Quando questo costruttore è invocato, ci si aspetta che restituisca un oggetto con almeno un metodo `render`. Questo oggetto è chiamato `ReactComponent`.

```javascript
var component = new MyComponent(props); // non farlo mai!
```

Per scopi diversi dai test, *non chiamerai mai* questo costruttore direttamente. React lo chiamerà per te.

Invece, passa una classe `ReactComponent` a `createElement` per ottenere un `ReactElement`.

```javascript
var element = React.createElement(MyComponent);
```

OPPURE usando JSX:

```javascript
var element = <MyComponent />;
```

Quando `element` viene passato a `ReactDOM.render`, React chiamerà il costruttore al tuo posto e creerà un`ReactComponent`, che verrà restituito.

```javascript
var component = ReactDOM.render(element, document.getElementById('example'));
```

Se chiami ripetutamente `ReactDOM.render` con lo stesso tipo di `ReactElement` e lo stesso `Element` DOM come contenitore, ti restituirà sempre la stessa istanza. Questa istanza è dotata di stato.

```javascript
var componentA = ReactDOM.render(<MyComponent />, document.getElementById('example'));
var componentB = ReactDOM.render(<MyComponent />, document.getElementById('example'));
componentA === componentB; // true
```

Questo è il motivo per cui non dovresti mai costruire la tua istanza. Invece, `ReactElement` è un `ReactComponent` virtuale prima che venga costruito. Un vecchio `ReactElement` e uno nuovo possono essere confrontati per vedere se una nuova istanza di `ReactComponent` è stata creata o quella esistente è stata riutilizzata.

Ci si aspetta che il metodo `render` di un `ReactComponent` restituisca un altro `ReactElement`. Ciò permette a questi componenti di essere composti. In ultima analisi, il rendering si risolve in un `ReactElement` con un tag `string` che viene istanziato come un `Element` DOM e viene inserito nel documento.


## Definizioni Formali dei Tipi

### Punto di Entrata

```
ReactDOM.render = (ReactElement, HTMLElement | SVGElement) => ReactComponent;
```

### Nodi ed Elementi

```
type ReactNode = ReactElement | ReactFragment | ReactText;

type ReactElement = ReactComponentElement | ReactDOMElement;

type ReactDOMElement = {
  type : string,
  props : {
    children : ReactNodeList,
    className : string,
    etc.
  },
  key : string | boolean | number | null,
  ref : string | null
};

type ReactComponentElement<TProps> = {
  type : ReactClass<TProps>,
  props : TProps,
  key : string | boolean | number | null,
  ref : string | null
};

type ReactFragment = Array<ReactNode | ReactEmpty>;

type ReactNodeList = ReactNode | ReactEmpty;

type ReactText = string | number;

type ReactEmpty = null | undefined | boolean;
```

### Classi e Componenti

```
type ReactClass<TProps> = (TProps) => ReactComponent<TProps>;

type ReactComponent<TProps> = {
  props : TProps,
  render : () => ReactElement
};
```
