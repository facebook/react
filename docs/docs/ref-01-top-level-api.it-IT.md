---
id: top-level-api-it-IT
title: API di Livello Elevato
permalink: docs/top-level-api-it-IT.html
next: component-api-it-IT.html
redirect_from: "/docs/reference.html"
---

## React

`React` è il punto di ingresso alla libreria React. Se stai usando uno dei pacchetti precompilati, è disponibile come variabile globale; se stai usando i moduli CommonJS puoi richiederlo con `require()`.


### React.Component

```javascript
class Component
```

Questa è la classe base per i componenti React quando sono definiti usando le classi ES6. Vedi [Componenti Riutilizzabili](/react/docs/reusable-components.html#es6-classes) per usare le classi ES6 con React. Per i metodi forniti dalla classe base, vedi la [API dei Componenti](/react/docs/component-api.html).


### React.createClass

```javascript
ReactClass createClass(object specification)
```

Crea la classe di un componente, data una specifica. Un componente implementa un metodo `render` che restituisce **un singolo** figlio. Tale figlio può avere una struttura di fogli arbitrariamente profonda. Una cosa che rende i componenti diversi dalle classi prototipiche standard è che non hai bisogno di chiamare `new` su di esse. Sono delle convenienti astrazioni che costruiscono (attraverso `new`) istanze dietro le quinte per te.

Per maggiori informazioni sull'oggetto specifica, vedi [Specifiche dei Componenti e Ciclo di Vita](/react/docs/component-specs.html).


### React.createElement

```javascript
ReactElement createElement(
  string/ReactClass type,
  [object props],
  [children ...]
)
```

Crea e restituisce un nuovo `ReactElement` del tipo desiderato. L'argomento `type` può essere una stringa contenente il nome di un tag HTML (ad es. 'div', 'span', etc), oppure una `ReactClass` (creata attraverso `React.createClass`).


### React.cloneElement

```
ReactElement cloneElement(
  ReactElement element,
  [object props],
  [children ...]
)
```

Clona e restituisce un nuovo `ReactElement` usando `element` come punto di partenza. L'elemento risultante avrà le proprietà dell'elemento originale, con le nuove proprietà unite in maniera superficiale. I figli esistenti sono sostituiti dai figli passati come `children`. Diversamente da `React.addons.cloneWithProps`, `key` e `ref` dell'elemento originale saranno preservati. Non esiste alcun comportamento speciale per riunire le proprietà (diversamente da `cloneWithProps`). Vedi l'[articolo del blog sulla v0.13 RC2](/react/blog/2015/03/03/react-v0.13-rc2.html) per maggiori dettagli.


### React.createFactory

```javascript
factoryFunction createFactory(
  string/ReactClass type
)
```

Restituisce una funzione che produce ReactElements di un tipo desiderato. Come `React.createElement`,
l'argomento `type` può essere sia la stringa contenente il nome di un tag HTML (ad es. 'div', 'span', etc), oppure una
`ReactClass`.


### ReactDOM.render

```javascript
ReactComponent render(
  ReactElement element,
  DOMElement container,
  [function callback]
)
```

Effettua il rendering di un ReactElement nel DOM all'interno dell'elemento `container` fornito e restituisce un [riferimento](/react/docs/more-about-refs-it-IT.html) al componente (oppure restituisce `null` per i [componenti privi di stato](/react/docs/reusable-components-it-IT.html#stateless-functions)).

Se il rendering del ReactElement è stato precedentemente effettuato all'interno di `container`, questa operazione effettuerà un aggiornamento su di esso e modificherà il DOM in modo necessario a riflettere il più recente componente React.

Se la callback opzionale è fornita, sarà eseguita dopo che il rendering o l'aggiornamento del componente sono stati effettuati.

> Nota:
>
> `ReactDOM.render()` controlla i contenuti del nodo contenitore che viene passato come argomento `container`. Gli elementi DOM
> esistenti al suo interno sono sostituiti quando viene chiamata la prima volta. Le chiamate successive usano l'algoritmo di
> differenza di React per aggiornamenti efficienti.
>
> `ReactDOM.render()` non modifica il nodo contenitore (modifica soltanto i figli del contenitore). In
> futuro potrebbe essere possibile inserire un componente in un nodo DOM esistente senza sovrascrivere i figli esistenti.


### ReactDOM.unmountComponentAtNode

```javascript
boolean unmountComponentAtNode(DOMElement container)
```

Rimuove un componente React montato nel DOM e ripulisce i suoi gestori di evento e lo stato. Se nessun componente è stato montato nel contenitore `container`, chiamare questa funzione non ha alcun effetto. Restituisce `true` se il componente è stato smontato e `false` se non è stato trovato un componente da smontare.


### ReactDOM.renderToString

```javascript
string renderToString(ReactElement element)
```

Effettua il rendering di un ReactElement come il suo HTML iniziale. Questo dovrebe essere utilizzato soltanto lato server. React restituirà una stringa di HTML. Puoi usare questo metodo per generare HTML sul server e inviare il markup come risposta alla richiesta iniziale per un più rapido caricamento della pagina, e permettere ai motori di ricerca di effettuare il crawling della tua pagina per ottimizzazione SEO.

Se chiami `ReactDOM.render()` su un nodo che possiede già questo markup generato lato server, React lo preserverà e vi attaccherà soltanto i gestori di eventi, permettendoti di avere una esperienza di primo caricamento altamente efficiente.


### ReactDOM.renderToStaticMarkup

```javascript
string renderToStaticMarkup(ReactElement element)
```

Simile a `renderToString`, eccetto che non crea attributi DOM aggiuntivi come `data-react-id`, che React utilizza internamente. Questo è utile se vuoi usare React come un semplice generatore di pagine statiche, in quanto eliminare gli attributi aggiuntivi può risparmiare parecchi byte.


### ReactDOM.isValidElement

```javascript
boolean isValidElement(* object)
```

Verifica che `object` sia un ReactElement.


### ReactDOM.findDOMNode

```javascript
DOMElement findDOMNode(ReactComponent component)
```
Se questo componente è stato montato nel DOM, restituisce il corrispondente elemento DOM nativo del browser. Questo metodo è utile per leggere i valori dal DOM, come i valori dei campi dei moduli ed effettuare misure sul DOM. Quando `render` restituisce `null` o `false`, `findDOMNode` restituisce `null`.

> Nota:
>
> `findDOMNode()` è una via di fuga usata per accedere al nodo DOM sottostante. Nella maggior parte dei casi, l'uso di questa via di fuga è scoraggiato perché viola l'astrazione del componente. Tuttavia, esistono delle situazioni in cui questo è necessario (ad esempio, potresti aver bisogno di trovare un nodo DOM per posizionarlo in maniera assoluta oppure determinarne la larghezza visualizzata misurata in pixel).

>
> `findDOMNode()` funziona soltanto su componenti montati (cioè, componenti che sono stati posizionati nel DOM). Se provi a chiamarlo su un componente che non è stato ancora montato (come chiamare `findDOMNode()` in `render()` su un componente che deve ancora essere creato) lancerà un'eccezione.

### React.DOM

`React.DOM` fornisce convenienti utilità che espongono `React.createElement` per componenti del DOM. Questi dovrebbero essere usate soltanto quando non si utilizza JSX. Ad esempio, `React.DOM.div(null, 'Ciao Mondo!')`


### React.PropTypes

`React.PropTypes` include tipi che possono essere usati con l'oggetto `propTypes` di un componente per validare le proprietà passate ai tuoi componenti. Per maggiori informazioni su `propTypes`, vedi [Componenti Riutilizzabili](/react/docs/reusable-components.html).


### React.Children

`React.Children` fornisce utilitià per gestire la struttura dati opaca `this.props.children`.

#### React.Children.map

```javascript
object React.Children.map(object children, function fn [, object thisArg])
```

Invoca `fn` su ciascuno dei diretti discendenti contenuti in `children`, con `this` impostato a `thisArg`. Se `children` è un oggetto annidato o un array, esso verrà attraversato: ad `fn` non saranno mai passati gli oggetti contenitori. Se `children` è `null` o `undefined` restituisce `null` o `undefined` anziché un oggetto vuoto.

#### React.Children.forEach

```javascript
React.Children.forEach(object children, function fn [, object thisArg])
```

Come `React.Children.map()` con la differenza che non restituisce un oggetto.

#### React.Children.count

```javascript
number React.Children.count(object children)
```

Restituisce il numero totale di componenti in `children`, uguale al numero di volte che una callback passata a `map` o `forEach` verrebbe invocata.

#### React.Children.only

```javascript
object React.Children.only(object children)
```

Restituisce il figlio unico contenuto in `children`, altrimenti lancia un'eccezione.
