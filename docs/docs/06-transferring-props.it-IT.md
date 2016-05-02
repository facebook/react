---
id: transferring-props-it-IT
title: Trasferimento delle Proprietà
permalink: docs/transferring-props-it-IT.html
prev: reusable-components-it-IT.html
next: forms-it-IT.html
---

Un pattern comune in React è l'uso di un'astrazione per esporre un componente. Il componente esterno espone una semplice proprietà per effettuare un'azione che può richiedere un'implementazione più complessa.

Puoi usare gli [attributi spread di JSX](/react/docs/jsx-spread.html) per unire le vecchie props con valori aggiuntivi:

```javascript
<Component {...this.props} more="values" />
```

Se non usi JSX, puoi usare qualsiasi helper come l'API `Object.assign` di ES6, o il metodo `_.extend` di Underscore:

```javascript
React.createElement(Component, Object.assign({}, this.props, { more: 'values' }));
```

Nel resto di questo tutorial vengono illustrate le best practices, usando JSX e sintassi sperimentale di ES7.

## Trasferimento Manuale

Nella maggior parte dei casi dovresti esplicitamente passare le proprietà. Ciò assicura che venga esposto soltanto un sottoinsieme dell'API interna, del cui funzionamento si è certi.

```javascript
function FancyCheckbox(props) {
  var fancyClass = props.checked ? 'FancyChecked' : 'FancyUnchecked';
  return (
    <div className={fancyClass} onClick={props.onClick}>
      {props.children}
    </div>
  );
}
ReactDOM.render(
  <FancyCheckbox checked={true} onClick={console.log.bind(console)}>
    Ciao mondo!
  </FancyCheckbox>,
  document.getElementById('example')
);
```

E se aggiungessimo una proprietà `name`? O una proprietà `title`? O `onMouseOver`?

## Trasferire con `...` in JSX

> NOTA:
>
> La sintassi `...` fa parte della proposta Object Rest Spread. Questa proposta è in processo di diventare uno standard. Consulta la sezione [Proprietà Rest e Spread ...](/react/docs/transferring-props.html#rest-and-spread-properties-...) di seguito per maggiori dettagli.

A volte passare manualmente ciascuna proprietà può essere noioso e fragile. In quei casi puoi usare l'[assegnamento destrutturante](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) con le proprietà residue per estrarre un insieme di proprietà sconosciute.

Elenca tutte le proprietà che desideri consumare, seguite da `...other`.

```javascript
var { checked, ...other } = props;
```

Ciò assicura che vengano passate tutte le proprietà TRANNE quelle che stai consumando tu stesso.

```javascript
function FancyCheckbox(props) {
  var { checked, ...other } = props;
  var fancyClass = checked ? 'FancyChecked' : 'FancyUnchecked';
  // `other` contiene { onClick: console.log } ma non la proprietà checked
  return (
    <div {...other} className={fancyClass} />
  );
}
ReactDOM.render(
  <FancyCheckbox checked={true} onClick={console.log.bind(console)}>
    Ciao mondo!
  </FancyCheckbox>,
  document.getElementById('example')
);
```

> NOTA:
>
> Nell'esempio precedente, la proprietà `checked` è anche un attributo DOM valido. Se non utilizzassi la destrutturazione in questo modo, potresti inavvertitamente assegnarlo al `div`.

Usa sempre il pattern di destrutturazione quando trasferisci altre proprietà sconosciute in `other`.

```javascript
function FancyCheckbox(props) {
  var fancyClass = props.checked ? 'FancyChecked' : 'FancyUnchecked';
  // ANTI-PATTERN: `checked` sarebbe passato al componente interno
  return (
    <div {...props} className={fancyClass} />
  );
}
```

## Consumare e Trasferire la Stessa Proprietà

Se il tuo componente desidera consumare una proprietà, ma anche passarla ad altri, puoi passarla esplicitamente mediante `checked={checked}`. Questo è preferibile a passare l'intero oggetto `this.props` dal momento che è più facile effettuarne il linting e il refactoring.

```javascript
function FancyCheckbox(props) {
  var { checked, title, ...other } = props;
  var fancyClass = checked ? 'FancyChecked' : 'FancyUnchecked';
  var fancyTitle = checked ? 'X ' + title : 'O ' + title;
  return (
    <label>
      <input {...other}
        checked={checked}
        className={fancyClass}
        type="checkbox"
      />
      {fancyTitle}
    </label>
  );
}
```

> NOTA:
>
> L'ordine è importante. Mettendo il `{...other}` prima delle tue proprietà JSX ti assicuri che il consumatore del tuo componente non possa ridefinirle. Nell'esempio precedente, abbiamo garantito che l'elemento input sarà del tipo `"checkbox"`.

## Proprietà Rest e Spread `...`

Le proprietà Rest ti permettono di estrarre le proprietà residue di un oggetto in un nuovo oggetto. Vengono escluse tutte le altre proprietà elencate nel pattern di destrutturazione.

Questa è un'implementazione sperimentale di una [proposta ES7](https://github.com/sebmarkbage/ecmascript-rest-spread).

```javascript
var { x, y, ...z } = { x: 1, y: 2, a: 3, b: 4 };
x; // 1
y; // 2
z; // { a: 3, b: 4 }
```

> Nota:
>
> Questa proposta ha raggiunto lo stadio 2 ed è attivata in modo predefinito in Babel. Vecchie versioni di Babel potrebbero richiedere l'abilitazione esplicita di questa trasformazione con `babel --optional es7.objectRestSpread`

## Trasferire con Underscore

Se non usi JSX, puoi usare una libreria per ottenere il medesimo pattern. Underscore supporta `_.omit` per omettere delle proprietà ed `_.extend` per copiare le proprietà in un nuovo oggetto.

```javascript
function FancyCheckbox(props) {
  var checked = props.checked;
  var other = _.omit(props, 'checked');
  var fancyClass = checked ? 'FancyChecked' : 'FancyUnchecked';
  return (
    React.DOM.div(_.extend({}, other, { className: fancyClass }))
  );
}
```
