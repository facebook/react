---
id: component-api-it-IT
title: API dei Componenti
permalink: docs/component-api-it-IT.html
prev: top-level-api-it-IT.html
next: component-specs-it-IT.html
---

## React.Component

Istanze di un React Component sono create internamente a React durante il rendering. Queste istanze sono riutilizzate in rendering successivi, e possono essere accedute dai metodi del tuo componente come `this`. L'unica maniera di ottenere un riferimento a una istanza di un React Component fuori da React è conservare il valore restituito da `ReactDOM.render`. All'interno di altri Component, puoi utilizzare [i ref](/react/docs/more-about-refs.html) per ottenere il medesimo risultato.


### setState

```javascript
void setState(
  function|object nextState,
  [function callback]
)
```
Effettua una combinazione di `nextState` nello stato attuale. Questo è il metodo principale che va usato per scatenare aggiornamenti della UI da gestori di eventi e callback di richieste al server.

Il primo argomento può essere un oggetto (contenente zero o più chiavi da aggiornare) o una funzione (con argomenti `state` e `props`) che restituisce un oggetto contenente chiavi da aggiornare.

Ecco come utilizzarla passando un oggetto:

```javascript
setState({mykey: 'my new value'});
```

È anche possibile passare una funzione con la firma `function(state, props)`. Questo può essere utile in certi casi quando desideri accodare un aggiornamento atomico che consulta i valori precedenti di state+props prima di impostare i nuovi valori. Ad esempio, supponi che vogliamo incrementare un valore nello stato:

```javascript
setState(function(previousState, currentProps) {
  return {myInteger: previousState.myInteger + 1};
});
```

Il secondo parametro (opzionale) è una funzione callback che verrà eseguita quando `setState` ha terminato e il rendering del componente è stato effettuato.

> Note:
>
> *MAI* modificare `this.state` direttamente, in quanto chiamare `setState()` successivamente potrebbe sovrascrivere la modifica fatta. Tratta `this.state` come se fosse immutabile.
>
> `setState()` non cambia immediatamente `this.state`, ma crea una transizione di stato in corso. Accedere `this.state` subito dopo aver chiamato questo metodo potrebbe potenzialmente restituire il valore precedente.
>
> Non viene garantita alcuna sincronicità per le chiamate di `setState`, e le chiamate stesse potrebbero essere raggruppate per migliorare le prestazioni.
>
> `setState()` scatena sempre un ri-rendering a meno che la logica di rendering condizionale venga implementata in `shouldComponentUpdate()`. Se oggetti mutabili sono usati e la logica non può essere implementata in `shouldComponentUpdate()`, chiamare `setState()` solo quando il nuovo stato differisce dal precedente eviterà ri-rendering superflui.


### replaceState

```javascript
void replaceState(
  object nextState,
  [function callback]
)
```

Come `setState()`, ma elimina ogni chiave preesistente che non si trova in `nextState`.

> Nota:
>
> Questo metodo non è disponibile il componenti `class` ES6 che estendono `React.Component`. Potrebbe essere eliminato del tutto in una versione futura di React.


### forceUpdate

```javascript
void forceUpdate(
  [function callback]
)
```

In modo predefinito, quando lo stato o le proprietà del tuo componente cambiano, ne verrà effettuato il ri-rendering. Tuttavia, se questi cambiano implicitamente (ad es.: dati profondi all'interno di un oggetto cambiano senza che l'oggetto stesso cambi) o se il tuo metodo `render()` dipende da altri dati, puoi istruire React perché riesegua `render()` chiamando `forceUpdate()`.

Chiamare `forceUpdate()` causerà la chiamata di `render()` sul componente, saltando l'esecuzione di `shouldComponentUpdate()`. Questo scatenerà i normali metodi del ciclo di vita per i componenti figli, incluso il metodo `shouldComponentUpdate()` di ciascun figlio. React tuttavia aggiornerà il DOM soltanto se il markup effettivamente cambia.

Normalmente dovresti cercare di evitare l'uso di `forceUpdate()` e leggere soltanto `this.props` e `this.state` all'interno di `render()`. Ciò rende il tuo componente "puro" e la tua applicazione molto più semplice ed efficiente.


### isMounted

```javascript
boolean isMounted()
```

`isMounted()` restituisce `true` se il rendering del componente è stato effettuato nel DOM, `false` altrimenti. Puoi usare questo metodo come guardia per chiamate asincrone a `setState()` o `forceUpdate()`.

> Nota:
>
> Questo metodo non è disponibile il componenti `class` ES6 che estendono `React.Component`. Potrebbe essere eliminato del tutto in una versione futura di React.
