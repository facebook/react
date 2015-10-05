---
id: component-specs-it-IT
title: Specifica dei Componenti e Ciclo di Vita
permalink: component-specs-it-IT.html
prev: component-api-it-IT.html
next: tags-and-attributes-it-IT.html
---

## Specifica dei Componenti

Quando crei una classe di componente invocando `React.createClass()`, devi fornire un oggetto specifica che contiene un metodo `render` che può contenere opzionalmete altri metodi del ciclo di vita descritti di seguito.

> Nota:
>
> È anche possibile usare pure classi JavaScript come classi di componente. Queste classi possono implementare la maggior parte degli stessi metodi, sebbene vi siano delle differenze. Per maggiori informazioni su queste differenze, leggi la nostra documentazione sulle [classi ES6](/react/docs/reusable-components.html#es6-classes).

### render

```javascript
ReactElement render()
```

Il metodo `render()` è richiesto.

Quando viene chiamato, dovrebbe esaminare `this.props` e `this.state` e restituire un singolo elemento figlio. Questo elemento figlio può essere sia una rappresentazione virtuale di un componente DOM nativo (come `<div />` o `React.DOM.div()`) o un altro componente composito che hai definito tu stesso.

Puoi anche restituire `null` o `false` per indicare che desideri che non venga visualizzato nulla. Dietro le quinte, React visualizza un tag `<noscript>` per lavorare con il nostro attuale algoritmo di differenza. Quando si restituisce `null` o `false`, `ReactDOM.findDOMNode(this)` restituirà `null`.

La funzione `render()` dovrebbe essere *pura*, nel senso che non modifica lo stato del componente, restituisce lo stesso risultato ogni volta che viene invocato, e non legge o scrive il DOM o interagisce in altro modo con il browser (ad es. usando `setTimeout`). Se devi interagire con il browser, effettua le tue operazioni in `componentDidMount()` o negli altri metodi del ciclo di vita. Mantenere `render()` puro rende il rendering lato server più praticabile e rende i componenti più facili da comprendere.


### getInitialState

```javascript
object getInitialState()
```

Invocato una volta prima che il componente venga montato. Il valore di ritorno sarà usato come il valore iniziale di `this.state`.


### getDefaultProps

```javascript
object getDefaultProps()
```

Invocato una volta e conservato quando la classe è creata. I valori nella mappa saranno impostati in `this.props` se tale proprietà non è specificata dal componente genitore (ad es. usando un controllo `in`).

Questo metodo è invocato prima che un'istanza sia creata e quindi non può dipendere da `this.props`. Inoltre, tieni presente che ogni oggetto complesso restituito da `getDefaultProps()` sarà condiviso tra le diverse istanze, non copiato.


### propTypes

```javascript
object propTypes
```

L'oggetto `propTypes` ti permette di validare le proprietà passate ai tuoi componenti. Per maggiori informazioni su `propTypes`, leggi [Componenti Riutilizzabili](/react/docs/reusable-components-it-IT.html).


### mixins

```javascript
array mixins
```

L'array `mixins` ti permette di usare i mixin per condividere il comportamento tra componenti multipli. Per maggiori informazioni sui mixin, leggi [Componenti Riutilizzabili](/react/docs/reusable-components-it-IT.html).


### statics

```javascript
object statics
```

L'oggetto `statics` ti permette di definire metodi statici che possono essere chiamati sulla classe del componente. Ad esempio:

```javascript
var MyComponent = React.createClass({
  statics: {
    customMethod: function(foo) {
      return foo === 'bar';
    }
  },
  render: function() {
  }
});

MyComponent.customMethod('bar');  // true
```

I metodi definiti in questo blocco sono _statici_, ovvero puoi eseguirli prima che un'istanza del componente venga creata, e i metodi non hanno accesso alle proprietà e lo stato dei tuoi componenti. Se desideri confrontare i valori delle proprietà in un metodo statico, devi farle passare dal chiamante al metodo statico tramite un argomento.


### displayName

```javascript
string displayName
```

La stringa `displayName` viene usata nei messaggi di debug. JSX imposta questo valore automaticamente; vedi [JSX in Profondità](/react/docs/jsx-in-depth-it-IT.html#the-transform).


## Metodi del Ciclo di Vita

Vari metodi vengono eseguiti durante precisi momenti del ciclo di vita di un componente.


### Montaggio: componentWillMount

```javascript
void componentWillMount()
```

Invocato una volta, sia sul client che sul server, immediatamente prima che il rendering iniziale abbia luogo. Se chiami `setState` all'interno di questo metodo, `render()` vedrà lo stato aggiornato e sarà eseguito solo una volta nonostante il cambiamento di stato.


### Montaggio: componentDidMount

```javascript
void componentDidMount()
```

Invocato una volta, solo sul client (e non sul server), immediatamente dopo che il rendering iniziale ha avuto luogo. A questo punto del ciclo di vita, il componente ha una rappresentazione DOM che puoi accedere attraverso `ReactDOM.findDOMNode(this)`. Il metodo `componentDidMount()` dei componenti figli è invocato prima di quello dei componenti genitori.

Se desideri integrare con altri framework JavaScript, impostare dei timer usando `setTimeout` o `setInterval`, oppure inviare richieste AJAX, effettua tali operazioni in questo metodo.


### Aggiornamento: componentWillReceiveProps

```javascript
void componentWillReceiveProps(
  object nextProps
)
```

Invocato quando un componente sta ricevendo nuove proprietà. Questo metodo non viene chiamato durante il rendering iniziale.

Usa questo metodo come opportunità per reagire a una transizione di proprietà prima che `render()` venga chiamato, aggiornando lo stato usando `this.setState()`. I vecchi valori delle proprietà possono essere letti tramite `this.props`. Chiamare `this.setState()` all'interno di questa funzione non scatenerà un rendering addizionale.

```javascript
componentWillReceiveProps: function(nextProps) {
  this.setState({
    likesIncreasing: nextProps.likeCount > this.props.likeCount
  });
}
```

> Nota:
>
> Non esiste un metodo analogo `componentWillReceiveState`. Una imminente transizione delle proprietà potrebbe causare un cambiamento di stato, ma il contrario non è vero. Se devi effettuare delle operazioni in risposta a un cambiamento di stato, usa `componentWillUpdate`.


### Aggiornamento: shouldComponentUpdate

```javascript
boolean shouldComponentUpdate(
  object nextProps, object nextState
)
```

Invocato prima del rendering quando vengono ricevuti nuove proprietà o un nuovo stato. Questo metodo non viene chiamato per il rendering iniziale o quando viene usato `forceUpdate`.

Usa questo metodo come opportunità per restituire `false` quando si è certi che la transizione alle nuove proprietà e al nuovo stato non richieda un aggiornamento del componente.

```javascript
shouldComponentUpdate: function(nextProps, nextState) {
  return nextProps.id !== this.props.id;
}
```

Se `shouldComponentUpdate` restituisce false, allora `render()` sarà saltato completamente fino al prossimo cambiamento di stato. Inoltre, `componentWillUpdate` e `componentDidUpdate` non verranno chiamati.

In modo predefinito, `shouldComponentUpdate` restituisce sempre `true` per evitare bachi subdoli quando `state` viene modificato direttamente, ma se hai l'accortezza di trattare sempre `state` come immutabile e accedere a `props` e `state` in sola lettura in `render()`, allora puoi tranquillamente ridefinire `shouldComponentUpdate` con un'implementazione che confronta i vecchi valori di props e state con quelli nuovi.

Se le prestazioni diventano un collo di bottiglia, specialmente in presenza di  decine o centinaia di componenti, usa `shouldComponentUpdate` per accelerare la tua applicazione.


### Aggiornamento: componentWillUpdate

```javascript
void componentWillUpdate(
  object nextProps, object nextState
)
```

Invocato immediatamente prima del rendering quando nuove proprietà o un nuovo stato vengono ricevuti. Questo metodo non viene chiamato per il rendering iniziale.

Usa questo metodo come opportunità per effettuare la preparazione prima che si verifichi un aggiornamento.

> Nota:
>
> *Non puoi* usare `this.setState()` in questo metodo. Se devi aggiornare lo stato in risposta al cambiamento di una proprietà, usa `componentWillReceiveProps`.


### Aggiornamento: componentDidUpdate

```javascript
void componentDidUpdate(
  object prevProps, object prevState
)
```

Invocato immediatamente dopo che gli aggiornamenti del componente sono stati trasmessi al DOM. Questo metodo non viene chiamato per il rendering iniziale.

Usa questo metodo come opportunità per operare sul DOM quando il componente è stato  the component has been updated.


### Smontaggio: componentWillUnmount

```javascript
void componentWillUnmount()
```

Invocato immediatamente prima che un componente venga smontato dal DOM.

Effettua la necessaria pulizia in questo metodo, come invalidare i timer o ripulire ciascun elemento DOM creato all'interno di `componentDidMount`.
