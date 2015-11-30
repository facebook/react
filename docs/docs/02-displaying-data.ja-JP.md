---
id: displaying-data-ja-JP
title: データを表示する
permalink: displaying-data-ja-JP.html
prev: why-react-ja-JP.html
next: jsx-in-depth-ja-JP.html

---

UIについて、最も基本的なことは、いくつかのデータを表示することです。Reactはデータを表示し、変更された時にはインターフェースを最新の状態に自動的に保つことが簡単にできるようになっています。

## はじめに

本当に単純な例を見てみましょう。`hello-react.html` ファイルを以下のようなコードで作成してください。

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Hello React</title>
    <script src="https://fb.me/react-{{site.react_version}}.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.23/browser.min.js"></script>
  </head>
  <body>
    <div id="example"></div>
    <script type="text/babel">

      // ** コードをここに書きます！ **

    </script>
  </body>
</html>
```

このドキュメントの中では、JavaScriptのコードにのみフォーカスします。そして、それが上のようなテンプレートに挿入されていると考えます。

```javascript
var HelloWorld = React.createClass({
  render: function() {
    return (
      <p>
        Hello, <input type="text" placeholder="Your name here" />!
        It is {this.props.date.toTimeString()}
      </p>
    );
  }
});

setInterval(function() {
  ReactDOM.render(
    <HelloWorld date={new Date()} />,
    document.getElementById('example')
  );
}, 500);
```


## リアクティブなアップデート

`hello-react.html` をウェブブラウザで開き、テキストフィールドにあなたの名前を入力してください。ReactはUIのうち、時間の文字列しか変更しないことに注意してください。あなたがテキストフィールドに入力したものは残っています。あなたはそういったコードを書いていないのにも関わらずです。Reactはあなたのことを理解しており、正しいことを行います。

このことについて私たちが理解できる方法は、Reactは必要になるまで、DOMの操作を行わないということです。 **Reactは、DOMの変化を表現し、あなたにもっとも効率的なDOMの変化を見積もるために早い、内部のモックのDOMを使っています。**

このコンポーネントのインプットは `props` と呼ばれるものです。"properties" の省略形です。それらはJSXシンタックスの中でアトリビュートとして渡されます。それらはコンポーネントの中で不変と考えるべきで、 **`this.props` と書かないようにしてください**

## コンポーネントは関数のようなものです。

Reactのコンポーネントはとても単純です。それらは `props` や `state`　（後述します）を取り、HTMLをレンダリングする単純な関数だと考えることができます。この考えの元、コンポーネントは簡単に理解することができます。

> 注意:
>
> **1つの制限**: Reactのコンポーネントは単一の最上位のノードだけをレンダリングします。複数のノードをリターンしたい場合は、単一の最上位のもので *ラップする必要があります* 。

## JSXシンタックス

私たちは関心を分離する正しい方法は「テンプレート」と「ディスプレイロジック」ではなくコンポーネントであると強く考えています。ビューを生成するマークアップとコードは密接につながっていると考えています。加えて、ディスプレイロジックはとても複雑になりえますし、ビューを表現するのにテンプレート言語を使うことはとてもややこしくなりえます。

私たちは、この問題の最適解は、UIを構築するのにリアルなプログラミング言語の表現力の全てを使うことができるように、JavaScriptのコードからHTMLやコンポーネントのツリーを直接生成することだと発見しました。

上記のことを簡単に行うために、私たちはReactのツリーノードを構築するためのとても単純で、 **オプショナルな** HTMLに似たシンタックスを加えました。

**JSXはHTMLのシンタックスを使ってJavaScriptのオブジェクトを構築するのを可能にします。** 純粋にJavaScriptを使ってReactでリンクを構築するには、以下のように書きます。

`React.createElement('a', {href: 'https://facebook.github.io/react/'}, 'Hello!')`

JSXでは、以下のように変換されます。

`<a href="https://facebook.github.io/react/">Hello!</a>`

以上のようなことで、Reactのアプリを作成するのは簡単になりましたし、デザイナーはこのシンタックスを好むようになると発見しました。しかし、人は自分自身のワークフローを持っているものです。 **JSXはReactを使う際に必ずしも必要ではありません。**

JSXはとても小さいです。さらに学ぶためには、[JSXの深層](/react/docs/jsx-in-depth-ja-JP.html)を参照ください。または、[ライブJSXコンパイラー](/react/jsx-compiler.html)で変換の動作を確認してください。

JSXはHTMLに似ていますが、正確に同じではありません。いくつかのキーの違いについては[JSXの理解](/react/docs/jsx-gotchas.html) をご覧ください。

JSXを初めて使う際に最も簡単なのは、ブラウザで `JSXTransformer` を使う方法です。これはプロダクションでは使わないことを強くお勧めします。コードは、コマンドラインの[react-tools](https://www.npmjs.com/package/react-tools)パッケージを使うことでプリコンパイルできます。

## JSXを使わないReact

JSXは完全にオプションです。Reactと一緒にJSXを使う必要はありません。`React.createElement` を使って、ただのJavaScriptでReactの要素を作ることもできます。それは、タグの名前やコンポーネント、プロパティのオブジェクト、いくつかのオプションの子要素をとります。

```javascript
var child1 = React.createElement('li', null, 'First Text Content');
var child2 = React.createElement('li', null, 'Second Text Content');
var root = React.createElement('ul', { className: 'my-list' }, child1, child2);
ReactDOM.render(root, document.getElementById('example'));
```
便利に書くために、カスタムコンポーネントで要素を作るために簡略した記法でファクトリー関数を作ることができます。

```javascript
var Factory = React.createFactory(ComponentClass);
...
var root = Factory({ custom: 'prop' });
ReactDOM.render(root, document.getElementById('example'));
```

Reactはすでに、共通なHTMLのタグについてはビルトインの関数を持っています。

```javascript
var root = React.DOM.ul({ className: 'my-list' },
             React.DOM.li(null, 'Text Content')
           );
```
