---
id: thinking-in-react-it-IT
title: Pensare in React
prev: tutorial-it-IT.html
next: conferences-it-IT.html
redirect_from: 'blog/2013/11/05/thinking-in-react.html'
---

di Pete Hunt

React è, a mio parere, la maniera più adeguata di costruire veloci applicazioni Web di grandi dimensioni con JavaScript. Ha scalato molto bene per noi a Facebook e Instagram.

Una delle molte parti migliori di React è come ti fa pensare alle applicazioni mentre le costruisci. In questo articolo vi guiderò attraverso il processo di pensiero per la costruzione di una tabella di dati di prodotti che possono essere cercati usando React.

## Comincia con un mock

Immagina di possedere già una API JSON e un mock prodotto dai nostri designer. I nostri designer apparentemente non sono molto capaci perché il mock ha questo aspetto:

![Mockup](/react/img/blog/thinking-in-react-mock.png)

La nostra API JSON restituisce dei dati che somigliano a quanto segue:

```
[
  {category: "Sporting Goods", price: "$49.99", stocked: true, name: "Football"},
  {category: "Sporting Goods", price: "$9.99", stocked: true, name: "Baseball"},
  {category: "Sporting Goods", price: "$29.99", stocked: false, name: "Basketball"},
  {category: "Electronics", price: "$99.99", stocked: true, name: "iPod Touch"},
  {category: "Electronics", price: "$399.99", stocked: false, name: "iPhone 5"},
  {category: "Electronics", price: "$199.99", stocked: true, name: "Nexus 7"}
];
```

## Passo 1: suddividi la UI in una gerarchia di componenti

La prima azione che vorrai compiere è disegnare dei rettangoli attorno a ciascun componente (e subcomponenti) nel mock e dare un nome a ciascuno di essi. Se stai lavorando con i designer, potrebbero averlo già fatto, quindi parla anzitutto con loro! I nomi dei loro layer di Photoshop potrebbero finire per diventare i nomi dei tuoi componenti React!

Come fai tuttavia a sapere cosa dovrebbe essere un componente a sé? Usa una delle tecniche per decidere se devi creare un nuovo oggetto o una nuova funzione. Una di tali tecniche è il [principio della singola responsibilità](https://en.wikipedia.org/wiki/Single_responsibility_principle), ovvero, un componente dovrebbe idealmente servire a un solo scopo. Se finisce per crescere, dovrebbe essere decomposto in componenti più piccoli.

Dal momento che stai spesso mostrando un modello di dati JSON all'utente, ti accorgerai che se il tuo modello è stato costruito correttamente, la tua UI (e quindi anche la struttura dei tuoi componenti) si adatterà facilmente. Ciò accade perché le UI e i modelli di dati tendono ad aderire alla medesima *architettura dell'informazione*, che significa che il compito di separare la tua UI in componenti è spesso banale. Suddividila semplicemente in componenti che rappresentano esattamente un frammento del tuo modello di dati.

![Diagramma dei componenti](/react/img/blog/thinking-in-react-components.png)

Vedrai che abbiamo in tutto cinque componenti nella nostra semplice applicazione. Ho scritto in corsivo i dati che ciascun componente rappresenta.

  1. **`FilterableProductTable` (arancione):** contiene l'intero esempio
  2. **`SearchBar` (blu):** riceve tutti gli *input dell'utente*
  3. **`ProductTable` (verde):** mostra e filtra la *collezione dei dati* basandosi sull'*input dell'utente*
  4. **`ProductCategoryRow` (turchese):** mostra un titolo per ciascuna *categoria*
  5. **`ProductRow` (rosso):** mostra una riga per ciascun *prodotto*

Se osservi la `ProductTable`, ti accorgerai che l'intestazione della tabella (che contiene le etichette "Name" e "Price") non è un componente a sé. Questa è una questione di gusti, e ci sono ragioni valide per ciascun approccio. Per questo esempio, l'ho lasciata parte di `ProductTable` perché fa parte della visualizzazione della *collezione dei dati* che è la responsabilità di `ProductTable`. Tuttavia, se questa intestazione cresce fino a diventare complessa (cioè se dovessimo aggiungere la possibilità di riordinare i dati), avrebbe certamente senso renderla un componente `ProductTableHeader` a sé.

Adesso che abbiamo identificato i componenti nel nostro mock, organizziamoli in una gerarchia. Questo è un compito facile. I componenti che appaiono all'interno di un altro componente nel the mock devono apparire come figli nella gerarchia:

  * `FilterableProductTable`
    * `SearchBar`
    * `ProductTable`
      * `ProductCategoryRow`
      * `ProductRow`

## Passo 2: Costruisci una versione statica in React

<iframe width="100%" height="600" src="https://jsfiddle.net/reactjs/yun1vgqb/embedded/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

Adesso che hai la tua gerarchia di componenti, è venuto il momento di implementare la tua applicazione. La maniera più semplice è costruire una versione che prende il tuo modello di dati e visualizza la UI ma non è interattiva. È buona norma disaccoppiare questi processi perché costruire una versione statica richiede la scrittura di parecchio codice e poco pensare, mentre aggiungere l'interattività richiede un parecchio pensare ma non un granché di scrittura. Vedremo perché.

Per costruire una versione statica della tua applicazione dhe visualizzi il tuo modello dei dati, vorrai costruire componenti che riutilizano altri componenti e passano loro dati usando le *props*. Le *props* sono una maniera di passare dati da genitore a figlio. Se hai dimestichezza con il concetto di *state*, **non usare lo stato** per costruire questa versione statica. Lo stato è riservato solo per l'interattività, cioè dati che cambiano nel tempo. Dal momento che questa è una versione statica dell'applicazione, non ne avrai bisogno.

Puoi costruire dall'alto in basso, o dal basso in alto. Ovvero, puoi cominciare a costruire i componenti più in alto nella gerarchia (cioè cominciare con `FilterableProductTable`) oppure con quelli più in basso (`ProductRow`). In esempi più semplici, è solitamente più facile andare dall'alto in basso, mentre in progetti più grandi è più facile andare dal basso in alto e scrivere test mentre costruisci.

Alla fine di questo passo avrai una libreria di componenti riutilizzabili che visualizzano il tuo modello dati. I componenti avranno soltanto metodi `render()` dal momento che questa è una versione statica della tua applicazione. Il componente al vertice della gerarchia (`FilterableProductTable`) prenderà il tuo modello dati come una proprietà. Se apporti un cambiamento al tuo modello dati sottostante e chiami nuovamente `ReactDOM.render()`, la UI sarà aggiornata. È facile vedere come la tua UI viene aggiornata e dove applicare cambiamenti dal momento che non c'è nulla di complicato. Il **flusso dati unidirezionale** di React (detto anche *binding unidirezionale*) mantiene tutto modulare e veloce.

Fai riferimento alla [documentazione React](/react/docs/) se hai bisogno di aiuto nell'eseguire questo passo.

### Un breve intermezzo: proprietà oppure stato

Esistono due tipi di dati "modello" in React: proprietà e stato. È importante capire la distinzione tra i due; scorri [la documentazione ufficiale di React](/react/docs/interactivity-and-dynamic-uis.html) se non hai ben chiara la differenza.

## Passo 3: Identifica la rappresentazione minima (ma completa) dello stato della UI

Per rendere la tua UI interattiva, hai bisogno di poter scatenare cambiamenti al tuo modello dati sottostante. React lo rende facile tramite lo **stato**.

Per costruire correttamente la tua applicaizone, devi prima pensare all'insieme minimo di stato mutevole di cui la tua applicazione ha bisogno. La chiave qui è il principio DRY: *Don't Repeat Yourself (Non ripeterti)*. Una volta compresa la rappresentazione minima in assoluto dello stato della tua applicazione e calcola tutto lil resto sul momento. Ad esempio, se stai costruendo una lista di cose da fare, mantieni un array delle cose da fare; non tenere una variabile di stato separata per il conteggio. Invece, quando vuoi visualizzare il conteggio degli elementi, prendi semplicemente la lunghezza dell'arraiy delle cose da fare.

Pensa a tutti gli elementi di dati nella nostra applicazione di esempio. Abbiamo:

  * La lista originaria dei prodotti
  * Il testo di ricerca che l'utente ha introdotto
  * Il valore del checkbox
  * La lista filtrata dei prodotti

Rivediamo ciascuno di essi e capiamo se si tratta di stato. Chiediti queste tre semplici domande su ciascun elemento di dati:

  1. Viene passato da un genitore attraverso le proprietà? Se sì, probabilmente non è stato.
  2. Cambia nel tempo? Se no, probabilmente non è stato.
  3. Puoi calcolarlo basandoti su altro stato o proprietà del tuo componente? Se sì, non è stato.

La lista originaria di prodotti viene passata come proprietà, quindi non si tratta di stato. Il testo di ricerca e la checkbox sembrano essere stato perché cambiano nel tempo e non possono essere ricavate da altri dati. Infine, la lista filtrata di prodotti non è stato, perché può essere calcolata combinando la lista originaria dei prodotti con il testo di ricerca e il valore della checkbox.

Quindi, per concludere, il nostro stato è:

  * Il testo di ricerca che l'utente ha introdotto
  * Il valore del checkbox

## Passo 4: Identifica dove debba risiedere il tuo stato

<iframe width="100%" height="600" src="https://jsfiddle.net/reactjs/zafjbw1e/embedded/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

OK, abbiamo dunque identificato quale sia l'insieme minimo dello stato dell'applicazione. Successivamente, dobbiamo identificare quale componente muta, o *possiede*, questo stato.

Ricorda: React è basato esclusivamente su flusso dati unidirezionale verso il basso della gerarchia dei componenti. Potrebbe non essere immediatamente chiaro quale componente debba possedere quale stato. **Questa è spesso la parte più difficile da capire per i principianti,** quindi segui questi passi per capirlo:

Per ogni elemento dello stato nella tua applicazione:

  * Identifica ciascun componente che visualizza qualcosa basato su quello stato.
  * Trova un componente proprietario comune (un singolo componente più in alto nella gerarchia di ciascun componente che ha bisogno dello stato).
  * Il proprietario comune o un altro componente più in alto nella gerarchia deve possedere lo stato.
  * Se non riesci a trovare un componente per cui abbia senso possedere lo stato, crea un nuovo componente con il solo scopo di contenere lo stato e aggiungilo da qualche parte nella gerarchia sopra il componente proprietario comune.

Applichiamo questa strategia per la nostra applicazione:

  * `ProductTable` deve filtrare la lista dei prodotti basandosi sullo stato e `SearchBar` deve visualizzare il testo di ricerca e lo stato della checkbox.
  * Il componente proprietario comune è `FilterableProductTable`.
  * Ha concettualmente senso che il testo di ricerca e lo stato della checkbox appartengano a `FilterableProductTable`

Bene, abbiamo deciso che il nostro stato appartenga a `FilterableProductTable`. Anzitutto aggiungiamo un metodo `getInitialState()` a `FilterableProductTable` che restituisce `{filterText: '', inStockOnly: false}` per riflettere lo stato iniziale della tua applicazione. Dunque, passiamo `filterText` e `inStockOnly` a `ProductTable` e `SearchBar` come una proprietà. Infine, usiamo queste proprietà per filtrare le righe in `ProductTable` e impostare i valori dei campi del modulo in `SearchBar`.

Puoi cominciare a vedere come si comporterà la tua applicazione: imposta `filterText` a `"ball"` e aggiorna la tua applicazione. Vedrai che la tabella dei dati è correttamente aggiornata.

## Passo 5: Aggiungi il flusso dati inverso

<iframe width="100%" height="600" src="https://jsfiddle.net/reactjs/n47gckhr/embedded/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

Finora abbiamo costruito un'applicazione che visualizza correttamente come una funzione di proprietà e stato che fluiscono verso il basso della gerarchia. Adesso è il momento di supportare il flusso dei dati nella direzione opposta: i componenti del modulo in profondità nella gerarchia devono aggiornare lo stato in `FilterableProductTable`.

React rende questo flusso dati esplicito per rendere più semplice la comprensione di come funziona la tua applicazione, ma richiede leggermente più codice di un tradizionale binding bidirezionale dei dati. React offre un add-on chiamato `ReactLink` per rendere questo pattern altrettanto conveniente del binding bidirezionale ma, per gli scopi di questo articolo, faremo tutto in modo esplicito.

Se provi a scrivere o spunti la casella nella versione attuale dell'esempio, vedrai che React ignora il tuo input. Questo è un comportamento intenzionale, in quanto abbiamo impostato la proprietà `value` del campo `input` perché sia sempre uguale al valore di `state` passato da `FilterableProductTable`.

Pensiamo a cosa vogliamo che accada. Vogliamo assicurarci che quando l'utente cambia il modulo noi aggiorniamo lo stato per riflettere l'input dell'utente. Dal momento che i componenti devono soltanto aggiornare il proprio stato, `FilterableProductTable` passerà una callback a `SearchBar` che sarà eseguita quando lo stato debba essere aggiornato. Possiamo utilizzare l'evento `onChange` sui campi di input per esserne notificati. E la callback passata da `FilterableProductTable` chiamerà `setState()`, e l'applicazione verrà aggiornata.

Anche se sembra complesso, si tratta realmente di poche righe di codice. Inoltre, il flusso dati attraverso l'applicazione è davvero esplicito.

## Tutto qui

Speriamo che questo ti abbia dato un'idea di come pensare a costruire componenti e applicazioni con React. Mentre potrebbe richiedere leggermente più codice di quanto si sia abituati a scrivere, ricorda che il codice è letto più spesso di quanto sia scritto, ed è estremamente facile leggere codice così esplicito e modulare. Mentre ti avvii a costruire grandi librerie di componenti, apprezzerai questa chiarezza e modularità, e con il riutilizzo del codice le tue righe di codice cominceranno a ridursi. :)
