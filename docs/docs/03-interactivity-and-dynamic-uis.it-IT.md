---
id: interactivity-and-dynamic-uis-it-IT
title: Interattività e UI Dinamiche
permalink: docs/interactivity-and-dynamic-uis-it-IT.html
prev: jsx-gotchas-it-IT.html
next: multiple-components-it-IT.html
---

Hai già [imparato a mostrare dati](/react/docs/displaying-data-it-IT.html) con React. Adesso vediamo come rendere le nostre UI interattive.


## Un Esempio Semplice

```javascript
var LikeButton = React.createClass({
  getInitialState: function() {
    return {liked: false};
  },
  handleClick: function(event) {
    this.setState({liked: !this.state.liked});
  },
  render: function() {
    var text = this.state.liked ? 'mi piace' : 'non mi piace';
    return (
      <p onClick={this.handleClick}>
        You {text} this. Click to toggle.
      </p>
    );
  }
});

ReactDOM.render(
  <LikeButton />,
  document.getElementById('example')
);
```


## Gestione degli Eventi ed Eventi Sintetici

Con React devi semplicemente passare il tuo gestore di eventi come una proprietà camelCased in modo simile a come faresti nel normale HTML. React si assicura che tutti gli eventi si comportano in maniera identica in IE8 e successivi implementando un sistema di eventi sintetici. Ovvero, React sa come propagare e catturare eventi secondo la specifica, e garantisce che gli eventi passati ai tuoi gestori di eventi siano consistenti con la [specifica W3C](http://www.w3.org/TR/DOM-Level-3-Events/), qualunque browser tu stia utilizzando.


## Dietro le Quinte: Binding Automatico e Delega degli Eventi

Dietro le quinte, React esegue alcune operazioni per mantenere il tuo codice ad alte prestazioni e facile da comprendere.

**Binding automatico:** Quando crei le callback in JavaScript, solitamente devi fare il binding esplicito del metodo alla sua istanza, in modo che il valore di `this` sia corretto. Con React, ogni metodo è automaticamente legato alla propria istanza del componente (eccetto quando si usa la sintassi delle classi ES6). React immagazzina il metodo legato in maniera tale da essere estremamente efficiente in termini di CPU e memoria. Ti permette anche di scrivere meno codice!

**Delega degli eventi:** React non associa realmente i gestori di eventi ai nodi stessi. Quando React si avvia, comincia ad ascoltare tutti gli eventi a livello globale usando un singolo event listener. Quando un componente viene montato o smontato, i gestori di eventi sono semplicemente aggiunti o rimossi da un mapping interno. Quando si verifica un evento, React sa come inoltrarlo utilizzando questo mapping. Quando non ci sono più gestori di eventi rimasti nel mapping, i gestori di eventi di React sono semplici operazioni fittizie. Per saperne di più sul perché questo approccio è veloce, leggi [l'eccellente articolo sul blog di David Walsh](http://davidwalsh.name/event-delegate).


## I Componenti Sono Macchine a Stati Finiti

React considera le UI come semplici macchine a stati finiti. Pensando alla UI come in uno di tanti stati diversi e visualizzando questi stati, è facile mantenere la UI consistente.

In React, aggiorni semplicemente lo stato di un componente, e quindi visualizzi una nuova UI basata su questo nuovo stato. React si occupa di aggiornare il DOM al tuo posto nella maniera più efficiente.


## Come Funziona lo Stato

Una maniera comune di informare React di un cambiamento nei dati è chiamare `setState(data, callback)`. Questo metodo effettua il merge di `data` in `this.state` e ridisegna il componente. Quando il componente ha terminato la fase di ri-rendering, la `callback` opzionale viene invocata. Nella maggior parte dei casi non avrai bisogno di fornire una `callback` dal momento che React si occuperà di mantenere la UI aggiornata per te.


## Quali Componenti Devono Avere uno Stato?

La maggior parte dei tuoi componenti dovrebbero semplicemente ricevere dei dati da `props` e visualizzarli. Tuttavia, a volte hai bisogno di reagire all'input dell'utente, una richiesta al server o il trascorrere del tempo. In questi casi utilizzi lo stato.

**Prova a mantenere il maggior numero possibile dei tuoi componenti privi di stato.** Facendo ciò, isolerai lo stato nel suo luogo logicamente corretto e minimizzerai la ridondanza, rendendo più semplice ragionare sulla tua applicazione.

Un pattern comune è quello di creare diversi componenti privi di stato che mostrano semplicemente dati, e di avere un componente dotato di stato al di sopra di essi nella gerarchia, che passa il proprio stato ai suoi figli tramite le `props`. Il componente dotato di stato incapsula tutta la logica di interazione, mentre i componenti privi di stato si occupano della visualizzazione dei dati in maniera dichiarativa.


## Cosa *Dovrebbe* Contenere lo Stato?

**Lo stato dovrebbe contenere dati che i gestori di eventi del componente possono modificare per scatenare un aggiornamento della UI.** In applicazioni reali, questi dati tendono ad essere molto limitati e serializzabili come JSON. Quando costruisci un componente dotato di stato, pensa alla minima rappresentazione possibile del suo stato, e conserva solo quelle proprietà in `this.state`. All'interno di `render()` calcola quindi ogni altra informazione necessaria basandoti sullo stato. Ti accorgerai che pensare e scrivere applicazioni in questo modo porta alla scrittura dell'applicazione più corretta, dal momento che aggiungere valori ridondanti o calcolati allo stato significherebbe doverli mantenere sincronizzati esplicitamente, anziché affidarti a React perché li calcoli al tuo posto.

## Cosa *Non Dovrebbe* Contenere lo Stato?

`this.state` dovrebbe contenere soltanto la quantità minima di dati indispensabile a rappresentare lo stato della tua UI. In quanto tale, non dovrebbe contenere:

* **Dati calcolati:** Non preoccuparti di precalcolare valori basati sullo stato — è più semplice assicurarti che la tua UI sia consistente se effettui tutti i calcoli all'interno di `render()`. Per esempio, se lo stato contiene un array di elementi di una lista, e vuoi mostrare il numero di elementi come stringa, mostra semplicemente `this.state.listItems.length + ' elementi nella lista'` nel tuo metodo `render()` anziché conservarlo nello stato.
* **Componenti React:** Costruiscili in `render()` basandoti sulle proprietà e sullo stato del componente.
* **Dati duplicati dalle proprietà:** Prova ad utilizzare le proprietà come fonte di verità ove possibile. Un uso valido dello stato per i valori delle proprietà è conservarne il valore precedente quando le proprietà cambiano nel tempo.
