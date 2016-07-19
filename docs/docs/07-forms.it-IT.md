---
id: forms-it-IT
title: Moduli
permalink: docs/forms-it-IT.html
prev: transferring-props-it-IT.html
next: working-with-the-browser-it-IT.html
---

I componenti dei moduli come `<input>`, `<textarea>` e `<option>` differiscono dagli altri componenti nativi poiché possono essere alterati tramite interazione dell'utente. Questi componenti forniscono interfacce che rendono più semplice gestire i moduli in risposta all'interazione dell'utente.

Per maggiori informazioni sugli eventi dell'elemento `<form>` consulta [Eventi dei Moduli](/react/docs/events.html#form-events).

## Proprietà Interattive

I componenti dei moduli supportano un numero di proprietà che vengono modificate dall'interazione dell'utente:

* `value`, supportato dai elementi `<input>` e `<textarea>`.
* `checked`, supportato dagli elementi `<input>` dal tipo `checkbox` o `radio`.
* `selected`, supportato dagli elementi `<option>`.

In HTML, in valore di `<textarea>` è impostato tramite un nodo di testo figlio. In React, devi invece usare la proprietà `value`.

I componenti dei moduli ti permettono di reagire ai cambiamenti impostando una callback come proprietà `onChange`. La proprietà `onChange` funziona in tutti i browser e viene scatenata in risposta all'interazione dell'utente quando:

* Il `value` di `<input>` o `<textarea>` cambia.
* Lo stato `checked` di `<input>` cambia.
* Lo stato `selected` di `<option>` cambia.

Come tutti gli eventi DOM, la proprietà `onChange` è supportata su tutti i componenti nativi e può essere usata per gestire la propagazione di eventi di cambiamento.

> Nota:
>
> Per `<input>` e `<textarea>`, `onChange` rimpiazza — e dovrebbe generalmente essere utilizzata in sostituzione — il gestore di eventi [`oninput`](https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/oninput) nativo del DOM.


## Componenti Controllati

Un `<input>` il cui `value` è impostato è un componente *controllato*. In un `<input>` controllato, il valore dell'elemento visualizzato si riflette sempre nella sua proprietà `value`. Ad esempio:

```javascript
  render: function() {
    return <input type="text" value="Ciao!" />;
  }
```

Ciò visualizzerà un input che ha sempre il valore di `value` impostato a `Ciao!`. Ciascuna immissione dell'utente non avrà effetto sull'elemento visualizzato poiché React ha dichiarato il suo `value` pari a `Ciao!`. Se volessi aggiornare il `value` in risposta all'input dell'utente, puoi usare l'evento `onChange`:

```javascript
  getInitialState: function() {
    return {value: 'Ciao!'};
  },
  handleChange: function(event) {
    this.setState({value: event.target.value});
  },
  render: function() {
    var value = this.state.value;
    return <input type="text" value={value} onChange={this.handleChange} />;
  }
```

In questo esempio, stiamo semplicemente accettando il valore più recente fornito dall'utente e aggiornando la proprietà `value` del componente `<input>`. Questo pattern semplifica l'implementazione di interfacce che rispondono o validano l'interazione dell'utente. Ad esempio:

```javascript
  handleChange: function(event) {
    this.setState({value: event.target.value.substr(0, 140)});
  }
```

Così si può accettare l'input dell'utente ma ne tronca il valore ai primi 140 caratteri.

### Potenziali Problemi con Checkbox e Radio Button

Fai attenzione che, allo scopo di normalizzare la gestione del cambiamento degli elementi checkbox e radio button, React usa un evento `click` al posto di un evento `change`. Nella maggior parte dei casi questo funziona nel modo previsto, tranne quando viene usato `preventDefault` in un gestore dell'evento `change`. `preventDefault` impedisce al browser di aggiornare visualmente l'input, anche se `checked` cambia il suo valore. Questo può essere evitato rimuovendo la chiamata a `preventDefault`, oppure effettuando il cambio del valore di `checked` tramite `setTimeout`.


## Componenti Non Controllati

Un `<input>` che non fornisce un `value` (o lo imposta a `null`) è un componente *non controllato*. In un `<input>` non controllato, il valore dell'elemento visualizzato rifletterà l'input dell'utente. Ad esempio:

```javascript
  render: function() {
    return <input type="text" />;
  }
```

Questo visualizzerà un campo di input il cui valore iniziale è vuoto. Ciascun input dell'utente si rifletterà immediatamente nell'elemento visualizzato. Se desideri reagire ai cambiamenti del valore, puoi usare il gestore di eventi `onChange` proprio come con i componenti controllati.

### Valore Predefinito

Se desideri inizializzare il componente con un valore non vuoto, puoi fornire una proprietà `defaultValue`. Ad esempio:

```javascript
  render: function() {
    return <input type="text" defaultValue="Ciao!" />;
  }
```

Questo esempio funzionerà in maniera simile all'esempio precedente sui **Componenti Controllati**.

Similmente, `<input>` supporta `defaultChecked` e `<select>` supporta `defaultValue`.

> Nota:
>
> Le proprietà `defaultValue` e `defaultChecked` sono usate soltanto durante il rendering iniziale. Se devi aggiornare il valore in un rendering successivo, dovrai usare un [componente controllato](#controlled-components).


## Argomenti Avanzati


### Perché Componenti Controllati?

Usare componenti di moduli come `<input>` in React presenta una difficoltà aggiuntiva, assente quando si scrive un modulo tradizionale in HTML. Ad esempio, in HTML:

```html
  <input type="text" name="title" value="Senza titolo" />
```

Questo visualizza un campo di input *inizializzato* con il valore `Senza titolo`. Quando l'utente modifica il campo, la *proprietà* `value` del nodo cambierà. Tuttavia, `node.getAttribute('value')` restituirà ancora il valore usato durante l'inizializzazione, `Senza titolo`.

Diversamente dall'HTML, i componenti React devono rappresentare lo stato della vista in ciascun momento e non soltanto durante l'inizializzazione. Ad esempio, in React:

```javascript
  render: function() {
    return <input type="text" name="title" value="Senza titolo" />;
  }
```

Dal momento che questo metodo descrive la vista in ogni momento, il valore del campo di testo deve *sempre* essere `Senza titolo`.


### Perché il Valore della Textarea?

In HTML, il valore di `<textarea>` è solitamente impostato usando un nodo di testo figlio:

```html
  <!-- antipattern: NON FARLO! -->
  <textarea name="description">Questa è la descrizione.</textarea>
```

Per l'HTML, questo approccio permette agli sviluppatori di fornire facilmente valori su più righe. Tuttavia, dal momento che React è JavaScript, non abbiamo limitazioni sulle stringhe e possiamo usare `\n` se desideriamo andare a capo. In un mondo in cui abbiamo `value` e `defaultValue`, il ruolo giocato dal nodo figlio è ambiguo. Per questa ragione, non dovresti utilizzare il nodo figlio quando imposti il valore delle `<textarea>`:

```javascript
  <textarea name="description" value="Questa è la descrizione." />
```

Se tuttavia decidi di *usare* il nodo di testo figlio, questo si comporterà come `defaultValue`.


### Perché il Value di Select?

L'elemento `<option>` selezionato in un elemento HTML `<select>` è normalmente specificato attraverso l'attributo `selected` dell'opzione stessa. In React, allo scopo di rendere i componenti più semplici da manipolare, viene invece adottato il formato seguente:

```javascript
  <select value="B">
    <option value="A">Arancia</option>
    <option value="B">Banana</option>
    <option value="C">Ciliegia</option>
  </select>
```

Per creare un componente non controllato, viene invece usato `defaultValue`.

> Nota:
>
> Puoi passare un array come valore dell'attributo `value`, se desideri selezionare più opzioni in un tag `select` a scelta multipla: `<select multiple={true} value={['B', 'C']}>`.
