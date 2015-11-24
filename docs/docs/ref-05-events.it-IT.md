---
id: events-it-IT
title: Sistema di Eventi
permalink: events-it-IT.html
prev: tags-and-attributes-it-IT.html
next: dom-differences-it-IT.html
---

## SyntheticEvent

Ai tuoi gestori di eventi saranno passate istanze di `SyntheticEvent`, un involucro cross-browser attorno all'evento nativo del browser. Possiede la stessa interfaccia dell'evento nativo del browser, incluso `stopPropagation()` e `preventDefault()`, con l'eccezione che gli eventi funzionano in modo identico su tutti i browser.

Se ti trovi nella situazione di avere bisogno dell'evento sottostante del browser per qualunque ragione, usa semplicemente l'attributo `nativeEvent` per ottenerlo. Ogni oggetto `SyntheticEvent` ha i seguenti attributi:

```javascript
boolean bubbles
boolean cancelable
DOMEventTarget currentTarget
boolean defaultPrevented
number eventPhase
boolean isTrusted
DOMEvent nativeEvent
void preventDefault()
boolean isDefaultPrevented()
void stopPropagation()
boolean isPropagationStopped()
DOMEventTarget target
number timeStamp
string type
```

> Nota:
>
> A partire dalla v0.14, restituire `false` da un gestore di eventi non fermerà più la propagazione dell'evento. Invece, `e.stopPropagation()` o `e.preventDefault()` devono essere invocati manualmente, in maniera appropriata.

## Riutilizzo degli eventi

Gli oggetti `SyntheticEvent` sono gestiti come un pool. Ciò significa che ciascun oggetto `SyntheticEvent` sarà riutilizzato e tutte le sue proprietà annullate dopo che la callback dell'evento è stata invocata.
Ciò avviene per ragioni di performance.
Per questo motivo non potrai accedere all'evento in maniera asincrona.

```javascript
function onClick(event) {
  console.log(event); // => oggetto annullato.
  console.log(event.type); // => "click"
  var eventType = event.type; // => "click"

  setTimeout(function() {
    console.log(event.type); // => null
    console.log(eventType); // => "click"
  }, 0);

  this.setState({clickEvent: event}); // Non funzionerà. this.state.clickEvent conterrà soltanto valori null.
  this.setState({eventType: event.type}); // Puoi sempre esportare le singole proprietà dell'evento.
}
```

> Nota:
>
> Se vuoi accedere alle proprietà dell'evento in maniera asincrona, devi invocare `event.persist()` sull'evento, che rimuoverà l'evento sintetico dal pool e permetterà ai riferimenti all'evento di essere mantenuti nel codice dell'utente.

## Eventi Supportati

React normalizza gli eventi in modo che abbiano proprietà consistenti su browser differenti.

I gestori di eventi seguenti sono scatenati da un evento nella fase di propagazione. Per registrare un gestore di eventi per la fase di cattura, aggiungi il suffisso `Capture` al nome dell'evento; ad esempio, anziché usare `onClick`, useresti `onClickCapture` per gestire l'evento click nella fase di cattura.


### Eventi della Clipboard

Nomi degli eventi:

```
onCopy onCut onPaste
```

Proprietà:

```javascript
DOMDataTransfer clipboardData
```


### Eventi di Composizione

Nomi degli eventi:

```
onCompositionEnd onCompositionStart onCompositionUpdate
```

Proprietà:

```javascript
string data

```


### Eventi di Tastiera

Nomi degli eventi:

```
onKeyDown onKeyPress onKeyUp
```

Proprietà:

```javascript
boolean altKey
number charCode
boolean ctrlKey
boolean getModifierState(key)
string key
number keyCode
string locale
number location
boolean metaKey
boolean repeat
boolean shiftKey
number which
```


### Eventi del Focus

Nomi degli eventi:

```
onFocus onBlur
```

Proprietà:

```javascript
DOMEventTarget relatedTarget
```


### Eventi dei Moduli

Nomi degli eventi:

```
onChange onInput onSubmit
```

Per maggiori informazioni sull'evento onChange, leggi [Moduli](/react/docs/forms.html).


### Eventi del Mouse

Nomi degli eventi:

```
onClick onContextMenu onDoubleClick onDrag onDragEnd onDragEnter onDragExit
onDragLeave onDragOver onDragStart onDrop onMouseDown onMouseEnter onMouseLeave
onMouseMove onMouseOut onMouseOver onMouseUp
```

Gli eventi `onMouseEnter` e `onMouseLeave` vengono propagati dal componente che viene abbandonato a quello in cui viene effettuato l'ingresso anziché seguire la propagazione ordinaria, e non posseggono una fase di cattura.

Proprietà:

```javascript
boolean altKey
number button
number buttons
number clientX
number clientY
boolean ctrlKey
boolean getModifierState(key)
boolean metaKey
number pageX
number pageY
DOMEventTarget relatedTarget
number screenX
number screenY
boolean shiftKey
```


### Eventi di Selezione

Nomi degli eventi:

```
onSelect
```


### Eventi del Tocco

Nomi degli eventi:

```
onTouchCancel onTouchEnd onTouchMove onTouchStart
```

Proprietà:

```javascript
boolean altKey
DOMTouchList changedTouches
boolean ctrlKey
boolean getModifierState(key)
boolean metaKey
boolean shiftKey
DOMTouchList targetTouches
DOMTouchList touches
```


### Eventi UI

Nomi degli eventi:

```
onScroll
```

Proprietà:

```javascript
number detail
DOMAbstractView view
```


### Eventi della Rotellina

Nomi degli eventi:

```
onWheel
```

Proprietà:

```javascript
number deltaMode
number deltaX
number deltaY
number deltaZ
```

### Eventi dei Media

Nomi degli eventi:

```
onAbort onCanPlay onCanPlayThrough onDurationChange onEmptied onEncrypted onEnded onError onLoadedData onLoadedMetadata onLoadStart onPause onPlay onPlaying onProgress onRateChange onSeeked onSeeking onStalled onSuspend onTimeUpdate onVolumeChange onWaiting
```

### Eventi delle Immagini

Nomi degli eventi:

```
onLoad onError
```
