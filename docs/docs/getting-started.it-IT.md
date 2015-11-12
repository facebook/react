---
id: getting-started-it-IT
title: Primi Passi
permalink: getting-started-it-IT.html
next: tutorial-it-IT.html
redirect_from: "docs/index.html"
---

## JSFiddle

La maniera più semplice di cominciare ad hackerare con React è usare i seguenti esempi di Hello World su JSFiddle:

 * **[React JSFiddle](https://jsfiddle.net/reactjs/69z2wepo/)**
 * [React JSFiddle senza JSX](https://jsfiddle.net/reactjs/5vjqabv3/)

## Starter Kit

Scarica lo starter kit per cominciare.

<div class="buttons-unit downloads">
  <a href="/react/downloads/react-{{site.react_version}}.zip" class="button">
    Scarica lo Starter Kit {{site.react_version}}
  </a>
</div>

Nella directory principale dello starter kit, crea `helloworld.html` con il seguente contenuto.

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Ciao React!</title>
    <script src="build/react.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.23/browser.min.js"></script>
  </head>
  <body>
    <div id="example"></div>
    <script type="text/babel">
      ReactDOM.render(
        <h1>Cial, mondo!</h1>,
        document.getElementById('example')
      );
    </script>
  </body>
</html>
```

La sintassi XML all'interno di JavaScript è chiamata JSX; dài un'occhiata alla [sintassi JSX](/react/docs/jsx-in-depth.html) per saperne di più. Allo scopo di tradurla in puro JavaScript usiamo `<script type="text/babel">` e includiamo Babel per effettuare la trasformazione effettiva nel browser.

### File Separato

Il tuo codice React JSX può trovarsi in un file a parte. Crea il seguente `src/helloworld.js`.

```javascript
ReactDOM.render(
  <h1>Ciao, mondo!</h1>,
  document.getElementById('example')
);
```

Quindi fai riferimento ad esso da `helloworld.html`:

```html{10}
<script type="text/babel" src="src/helloworld.js"></script>
```

Nota che in alcuni browsers (Chrome, ad esempio) falliranno nel caricamento del file a meno che non sia servito tramite HTTP.

### Trasformazione Offline

Anzitutto installa gli strumenti da riga di comando di [Babel](http://babeljs.io/) (è richiesto [npm](https://www.npmjs.com/)):

```
npm install --global babel
```

Quindi, traduci il tuo file `src/helloworld.js` a semplice JavaScript:

```
babel src --watch --out-dir build

```

Il file `build/helloworld.js` è generato automaticamente ogni qualvolta effettui un cambiamento. Leggi la [documentazione di Babel CLI](http://babeljs.io/docs/usage/cli/) per un uso più avanzato.

```javascript{2}
ReactDOM.render(
  React.createElement('h1', null, 'Ciao, mondo!'),
  document.getElementById('example')
);
```


Aggiorna il tuo file HTML come segue:

```html{7,11}
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Ciao React!</title>
    <script src="build/react.js"></script>
    <!-- Non c'è bisogno di Babel! -->
  </head>
  <body>
    <div id="example"></div>
    <script src="build/helloworld.js"></script>
  </body>
</html>
```

## Vuoi CommonJS?

Se vuoi usare React con [browserify](http://browserify.org/), [webpack](https://webpack.github.io/), o un altro sistema modulare compatibile con CommonJS, usa il [pacchetto npm `react`](https://www.npmjs.com/package/react). In aggiunta, lo strumento di build `jsx` può essere integrato in quasi tutti i sistemi di packaging (non soltanto CommonJS) assai facilmente.

## Passi Successivi

Dài un'occhiata [al tutorial](/react/docs/tutorial-it-IT.html) e agli altri esempi nella directory `examples` dello starter kit per saperne di più.

Abbiamo anche un wiki al quale la comunità contribuisce con [flussi di lavoro, componenti UI, routing, gestione dati etc.](https://github.com/facebook/react/wiki/Complementary-Tools)

In bocca al lupo, e benvenuto/a!
