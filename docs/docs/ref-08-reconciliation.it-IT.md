---
id: reconciliation-it-IT
title: Riconciliazione
permalink: docs/reconciliation-it-IT.html
prev: special-non-dom-attributes-it-IT.html
next: webcomponents.html
---

La decisione chiave del design di React è fare in modo che l'API sembri ripetere il rendering dell'intera applicazione per ciascun aggiornamento. Ciò rende la scrittura delle applicazione molto più semplice, ma è anche una sfida incredibile per renderlo trattabile. Questo articolo spiega come siamo riusciti a trasformare, tramite potenti euristiche, un problema O(n<sup>3</sup>) in uno O(n).


## Motivazione

Generare il minimo numero di operazioni necessarie a trasformare un albero in un altro è un problema complesso e ben noto. Gli [algoritmi dello stato dell'arte](http://grfia.dlsi.ua.es/ml/algorithms/references/editsurvey_bille.pdf) hanno una complessità dell'ordine di O(n<sup>3</sup>) dove n è il numero di nodi dell'albero.

Ciò significa che visualizzare 1000 nodi richiederebbe un numero di confronti dell'ordine del miliardo. Ciò è decisamente troppo costoso per il nostro caso d'uso. Per mettere questo numero in prospettiva, le CPU oggi giorno eseguono approssimativamente 3 miliardi di istruzioni al secondo. Quindi anche con l'implementazione più efficiente, non saremmo in grado di calcolare la differenza in meno di un secondo.

Dal momento che un algoritmo ottimo non è trattabile, implementiamo un algoritmo O(n) non ottimale usando euristiche basate su due assunzioni:

1. Due componenti della stessa classe genereranno alberi simili e due componenti di classi diverse genereranno alberi diversi.
2. È possibile fornire una chiave unica per gli elementi che sia stabile durante rendering differenti.

In pratica, queste assunzioni sono eccezionalmente veloci per quasi tutti i casi d'uso pratici.


## Differenza a coppie

Per effettuare la differenza di due alberi, dobbiamo prima essere capaci di effettuare la differenza tra due nodi. Esistono tre diversi casi da considerare.


### Tipi di Nodo Differenti

Se il tipo di nodo è differente, React li tratterà come due sottoalberi diversi, getterà via il primo e costruirà e inserirà il secondo.

```xml
renderA: <div />
renderB: <span />
=> [removeNode <div />], [insertNode <span />]
```

La stessa logica è usata per i componenti personalizzati. Se non sono dello stesso tipo, React non proverà neppure a confrontare ciò che visualizzano. Rimuoverà soltanto il primo dal DOM e inserirà il secondo.

```xml
renderA: <Header />
renderB: <Content />
=> [removeNode <Header />], [insertNode <Content />]
```

Possedere questa conoscenza di alto livello è un aspetto molto importante del perché l'algoritmo di differenza di React è sia veloce che preciso. Ciò fornisce una buona euristica per potare rapidamente gran parte dell'albero e concentrarsi su parti che hanno una buona probabilità di essere simili.

È molto improbabile che un elemento `<Header>` generi un DOM che somigli a quello generato da un elemento `<Content>`. Anziché perdere tempo provando a confrontare queste due strutture, React semplicemente ricostruisce l'albero da zero.

Come corollario, se c'è un elemento `<Header>` nella stessa posizione in due rendering consecutivi, ti puoi aspettare di trovare una struttura molto simile che vale la pena di esplorare.


### Nodi DOM

Quando vengono confrontati nodi DOM, guardiamo gli attributi di entrambi e decidiamo quali di essi sono cambiati in un tempo lineare.

```xml
renderA: <div id="before" />
renderB: <div id="after" />
=> [replaceAttribute id "after"]
```

Anziché trattare lo stile come una stringa opaca, viene rappresentato come un oggetto chiave-valore. Ciò ci permette di aggiornare solo le proprietà che sono cambiate.

```xml
renderA: <div style={{'{{'}}color: 'red'}} />
renderB: <div style={{'{{'}}fontWeight: 'bold'}} />
=> [removeStyle color], [addStyle font-weight 'bold']
```

Dopo che gli attributi sono stati aggiornati, effettuiamo un confronto ricorsivo su ciascuno dei nodi figli.


### Componenti Personalizzati

We decided that the two custom components are the same. Since components are stateful, we cannot just use the new component and call it a day. React takes all the attributes from the new component and calls `component[Will/Did]ReceiveProps()` on the previous one.

The previous component is now operational. Its `render()` method is called and the diff algorithm restarts with the new result and the previous result.


## List-wise diff

### Problematic Case

In order to do children reconciliation, React adopts a very naive approach. It goes over both lists of children at the same time and generates a mutation whenever there's a difference.

For example if you add an element at the end:

```xml
renderA: <div><span>first</span></div>
renderB: <div><span>first</span><span>second</span></div>
=> [insertNode <span>second</span>]
```

Inserting an element at the beginning is problematic. React is going to see that both nodes are spans and therefore run into a mutation mode.

```xml
renderA: <div><span>first</span></div>
renderB: <div><span>second</span><span>first</span></div>
=> [replaceAttribute textContent 'second'], [insertNode <span>first</span>]
```

There are many algorithms that attempt to find the minimum sets of operations to transform a list of elements. [Levenshtein distance](https://en.wikipedia.org/wiki/Levenshtein_distance) can find the minimum using single element insertion, deletion and substitution in O(n<sup>2</sup>). Even if we were to use Levenshtein, this doesn't find when a node has moved into another position and algorithms to do that have much worse complexity.

### Keys

In order to solve this seemingly intractable issue, an optional attribute has been introduced. You can provide for each child a key that is going to be used to do the matching. If you specify a key, React is now able to find insertion, deletion, substitution and moves in O(n) using a hash table.


```xml
renderA: <div><span key="first">first</span></div>
renderB: <div><span key="second">second</span><span key="first">first</span></div>
=> [insertNode <span>second</span>]
```

In practice, finding a key is not really hard. Most of the time, the element you are going to display already has a unique id. When that's not the case, you can add a new ID property to your model or hash some parts of the content to generate a key. Remember that the key only has to be unique among its siblings, not globally unique.


## Trade-offs

It is important to remember that the reconciliation algorithm is an implementation detail. React could re-render the whole app on every action; the end result would be the same. We are regularly refining the heuristics in order to make common use cases faster.

In the current implementation, you can express the fact that a sub-tree has been moved amongst its siblings, but you cannot tell that it has moved somewhere else. The algorithm will re-render that full sub-tree.

Because we rely on two heuristics, if the assumptions behind them are not met, performance will suffer.

1. The algorithm will not try to match sub-trees of different components classes. If you see yourself alternating between two components classes with very similar output, you may want to make it the same class. In practice, we haven't found this to be an issue.

2. If you don't provide stable keys (by using Math.random() for example), all the sub-trees are going to be re-rendered every single time. By giving the users the choice to choose the key, they have the ability to shoot themselves in the foot.
