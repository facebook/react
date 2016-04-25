---
id: multiple-components-it-IT
title: Componenti Multipli
permalink: docs/multiple-components-it-IT.html
prev: interactivity-and-dynamic-uis-it-IT.html
next: reusable-components-it-IT.html
---

Finora abbiamo visto come scrivere un singolo componente per mostrare dati e gestire l'input dell'itente. Adesso esaminiamo una delle migliori caratteristiche di React: la componibilità.


## Motivazione: Separazione dei Concetti

Costruendo componenti modulari che riutilizzano altri componenti con interfacce ben definite, ottieni gli stessi benefici che otterresti usando funzioni o classi. Nello specifico, puoi *separare i diversi concetti* della tua applicazione nel modo che preferisci semplicemente costruendo nuovi componenti. Costruendo una libreria di componenti personalizzati per la tua applicazione, stai esprimendo la tua UI in una maniera che si adatta meglio al tuo dominio.


## Esepmio di Composizione

Creiamo un semplice componente Avatar che mostra una foto del profilo e un nome utente usando la Graph API di Facebook.

```javascript
var Avatar = React.createClass({
  render: function() {
    return (
      <div>
        <ProfilePic username={this.props.username} />
        <ProfileLink username={this.props.username} />
      </div>
    );
  }
});

var ProfilePic = React.createClass({
  render: function() {
    return (
      <img src={'https://graph.facebook.com/' + this.props.username + '/picture'} />
    );
  }
});

var ProfileLink = React.createClass({
  render: function() {
    return (
      <a href={'https://www.facebook.com/' + this.props.username}>
        {this.props.username}
      </a>
    );
  }
});

ReactDOM.render(
  <Avatar username="pwh" />,
  document.getElementById('example')
);
```


## Possesso

Nell'esempio precedente, le istanze di `Avatar` *posseggono* instanze di `ProfilePic` e `ProfileLink`. In React, **un proprietario è il componente che imposta le `props` di altri componenti**. Più formalmente, se un componente `X` è creato nel metodo `render()` del componente `Y`, si dice che `X` è *di proprietà di* `Y`. Come discusso in precedenza, un componente non può mutare le sue `props` — sono sempre consistenti con il valore che il suo proprietario ha impostato. Questa invariante fondamentale porta a UI la cui consistenza può essere garantita.

È importante distinguere tra la relazione di proprietario-proprietà e la relazione genitore-figlio. La relazione proprietario-proprietà è specifica di React, mentre la relazione genitore-figlio è semplicemente quella che conosci e ami del DOM. Nell'esempio precedente, `Avatar` possiede il `div`, le istanze di `ProfilePic` e `ProfileLink`, e `div` è il **genitore** (ma non il proprietario) delle istanze di `ProfilePic` e `ProfileLink`.


## Figli

Quando crei un'istanza di un componente React, puoi includere componenti React aggiuntivi o espressioni JavaScript tra i tag di apertura e chiusura come segue:

```javascript
<Parent><Child /></Parent>
```

`Parent` può accedere ai propri figli leggendo la speciale proprietà `this.props.children`. **`this.props.children` è una struttura dati opaca:** usa le [utilità React.Children](/react/docs/top-level-api.html#react.children) per manipolare i figli.


### Riconciliazione dei Figli

**La riconciliazione è il processo per il quale React aggiorna il DOM ad ogni passata di rendering.** In generale, i figli sono riconciliati secondo l'ordine in cui sono mostrati. Per esempio, supponiamo che due passate di rendering generino rispettivamente il markup seguente:

```html
// Prima passata di rendering
<Card>
  <p>Paragrafo 1</p>
  <p>Paragrafo 2</p>
</Card>
// Seconda passata di rendering
<Card>
  <p>Paragrafo 2</p>
</Card>
```

Intuitivamente, `<p>Paragrafo 1</p>` è stato rimosso. Invece, React riconcilierà il DOM cambiando il testo contenuto nel primo figlio e distruggerà l'ultimo figlio. React reconcilia secondo l'*ordine* dei figli.


### Figli Dotati di Stato

Per molti componenti, questo non è un grande problema. Tuttavia, per i componenti dotati di stato che mantengono dati in `this.state` attraverso le diverse passate di rendering, questo può essere problematico.

In molti casi, questo problema può essere aggirato nascondendo gli elementi anziché distruggendoli:

```html
// Prima passata di rendering
<Card>
  <p>Paragrafo 1</p>
  <p>Paragrafo 2</p>
</Card>
// Seconda passata di rendering
<Card>
  <p style={{'{{'}}display: 'none'}}>Paragrafo 1</p>
  <p>Paragrafo 2</p>
</Card>
```


### Figli Dinamici

La situazione si complica quando i figli sono rimescolati (come nei risultati della ricerca) o se nuovi componenti sono aggiunti all'inizio della lista (come negli stream). In questi casi quando l'identità e lo stato di ogni figlio deve essere preservato attraverso passate di rendering, puoi unicamente identificare ciascun figlio assegnandogli una proprietà `key`:

```javascript
  render: function() {
    var results = this.props.results;
    return (
      <ol>
        {results.map(function(result) {
          return <li key={result.id}>{result.text}</li>;
        })}
      </ol>
    );
  }
```

Quando React riconcilia i figli dotati di `key`, si assicurerà che ciascun figlio con la proprietà `key` sia riordinato (anziché  clobbered) o distrutto (anziché riutilizzato).

La proprietà `key` dovrebbe *sempre* essere fornita direttamente all'elemento del componente nell'array, non al contenitore HTML di ciascun componente dell'array:

```javascript
// SBAGLIATO!
var ListItemWrapper = React.createClass({
  render: function() {
    return <li key={this.props.data.id}>{this.props.data.text}</li>;
  }
});
var MyComponent = React.createClass({
  render: function() {
    return (
      <ul>
        {this.props.results.map(function(result) {
          return <ListItemWrapper data={result}/>;
        })}
      </ul>
    );
  }
});
```
```javascript
// Corretto :)
var ListItemWrapper = React.createClass({
  render: function() {
    return <li>{this.props.data.text}</li>;
  }
});
var MyComponent = React.createClass({
  render: function() {
    return (
      <ul>
        {this.props.results.map(function(result) {
           return <ListItemWrapper key={result.id} data={result}/>;
        })}
      </ul>
    );
  }
});
```

Puoi anche assegnare chiavi ai figli passandogli un oggetto ReactFragment. Leggi [Frammenti con Chiave](create-fragment.html) per maggiori dettagli.

## Flusso dei Dati

In React, i dati fluiscono dal proprietario al componente posseduto attraverso le `props` come discusso in precedenza. Questo è a tutti gli effetti un binding di dati unidirezionale: i proprietari legano le proprietà dei componenti di loro proprietà a dei valori che il proprietario stesso ha calcolato in base ai propri `props` o `state`. Dal momento che questo processo avviene ricorsivamente, i cambiamenti dei dati vengono riflessi automaticamente ovunque vengano usati.


## Una Nota sulle Prestazioni

Ti starai chiedendo che cambiare i dati sia un'operazione costosa in presenza di un gran numero di nodi sotto un proprietario. La buona notizia è che JavaScript è veloce e i metodi `render()` tendono ad essere molto semplici, quindi in molte applicazioni questo è un processo estremamente veloce. Inoltre, il collo di bottiglia è quasi sempre la mutazione del DOM e non l'esecuzione di JS. React ottimizzerà tutto per te usando il raggruppamento e osservando i cambiamenti.

Tuttavia, a volte vorrai avere un controllo più raffinato sulle tue prestazioni. In tal caso, ridefinisci il metodo `shouldComponentUpdate()` per restituire false quando vuoi che React salti il trattamento di un sottoalbero. Consulta [la documentazione di riferimento di React](/react/docs/component-specs.html) per maggiori informazioni.

> Nota:
>
> Se `shouldComponentUpdate()` restituisce false quando i dati sono effettivamente cambiati, React non è in grado di mantenere la tua UI in sincronia. Assicurati di usare questa tecnica con cognizione di causa, e soltanto in presenza di problemi percettibili di prestazioni. Non sottovalutare l'estrema velocità di esecuzione di JavaScript se paragonata a quella del DOM.
