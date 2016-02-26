---
id: getting-started-ja-JP
title: 始めてみましょう
permalink: getting-started-ja-JP.html
next: tutorial-ja-JP.html
redirect_from: "docs/index-ja-JP.html"
---

## JSFiddle

React でのハッキングを始めるにあたり、一番簡単なものとして次の JSFiddle で動いている Hello World の例を取り上げます。

 * **[React JSFiddle](https://jsfiddle.net/reactjs/69z2wepo/)**
 * [React JSFiddle without JSX](https://jsfiddle.net/reactjs/5vjqabv3/)

## スターターキット

始めるためにスターターキットをダウンロードしましょう。

<div class="buttons-unit downloads">
  <a href="/react/downloads/react-{{site.react_version}}.zip" class="button">
    Download Starter Kit {{site.react_version}}
  </a>
</div>

スターターキットのルートディレクトリに `helloworld.html` を作り、次のように書いてみましょう。

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Hello React!</title>
    <script src="build/react.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.23/browser.min.js"></script>
  </head>
  <body>
    <div id="example"></div>
    <script type="text/babel">
      ReactDOM.render(
        <h1>Hello, world!</h1>,
        document.getElementById('example')
      );
    </script>
  </body>
</html>
```

JavaScript の中に書かれた XML シンタックスは JSX と呼ばれるものです（JSX の詳しいことについては [JSX syntax](/react/docs/jsx-in-depth.html) を読んでください）。ここでは JSX から vanilla JavaScript への変換をブラウザ内で行わせるため、先程のコードには `<script type="text/jsx">` と書いており、加えて `JSXTransformer.js` を読み込ませています。

### ファイルの分割

React の JSX コードは別ファイルに分離することができます。 次のような `src/helloworld.js` を作ってみましょう。

```javascript
ReactDOM.render(
  <h1>Hello, world!</h1>,
  document.getElementById('example')
);
```

それが終わったら、`helloworld.js` への参照を `helloworld.html` に書き込みましょう。

```html{10}
<script type="text/babel" src="src/helloworld.js"></script>
```

### オフラインでの変換

まずはコマンドラインツールをインストールしましょう（[npm](https://www.npmjs.com/) が必要です）。

```
npm install -g react-tools
```

インストールが終わったら、先程書いた `src/helloworld.js` ファイルを生の JavaScript に変換してみましょう。

```
jsx --watch src/ build/

```

すると、`src/helloword.js` に変更を加えるごとに `build/helloworld.js` が自動で生成されるようになります。

```javascript{2}
ReactDOM.render(
  React.createElement('h1', null, 'Hello, world!'),
  document.getElementById('example')
);
```


最後に HTML ファイルを以下のように書き換えましょう。

```html{7,11}
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Hello React!</title>
    <script src="build/react.js"></script>
    <!-- Babel は必要ありません！ -->
  </head>
  <body>
    <div id="example"></div>
    <script src="build/helloworld.js"></script>
  </body>
</html>
```

## CommonJS を使うには

React を [browserify](http://browserify.org/) や [webpack](https://webpack.github.io/)、または CommonJS 準拠の他のモジュールシステムと一緒に使いたい場合、 [`react` npm package](https://www.npmjs.com/package/react) を使ってみてください。また、`jsx` ビルドツールをパッケージングシステム（CommonJS に限らず）に導入することも非常に簡単です。

## 次にすること

[チュートリアル](/react/docs/tutorial-ja-JP.html) や、スターターキットの `examples` ディレクトリに入っている他の例を読んでみてください。

また、[ワークフロー、UIコンポーネント、ルーティング、データマネジメントなど](https://github.com/facebook/react/wiki/Complementary-Tools)の方面で貢献しているコミュニティの wiki もあります。

幸運を祈ります！React へようこそ！
