---
id: top-level-api-ja-JP
title: Top-Level API
permalink: docs/top-level-api-ja-JP.html
next: component-api-ja-JP.html
redirect_from: "/docs/reference-ja-JP.html"
---

## React

`React` はReactのライブラリに対するエントリーポイントです。事前にビルドされたパッケージを使用する場合は、グローバルで使用可能です。CommonJSのモジュールを使用する場合は、 `require()` できます。


### React.Component

```javascript
class Component
```

これは、ES6のクラスを使用して定義されている場合の、Reactコンポーネントに対する基底クラスです。ReactでES6のクラスを使用する方法については、[再利用可能なコンポーネント](/react/docs/reusable-components-ja-JP.html#es6-classes)をご覧ください。基底クラスからどのメソッドが実際に提供されるかについては、[コンポーネントAPI](/react/docs/component-api-ja-JP.html)をご覧ください。

### React.createClass

```javascript
ReactClass createClass(object specification)
```

与えられた仕様に基づいてコンポーネントクラスを作成します。コンポーネントは **ある単一の** 子要素を返す `render` メソッドを実行します。その子要素は勝手に深い子要素の構造を保持しています。コンポーネントが標準的なプロトタイプのクラスと異なっている部分は、newを呼ぶ必要がないということです。それらは内部で（newを行う）インスタンスを構築する便利なラッパーです。

specificationオブジェクトについての情報は、[コンポーネントのスペックとライフサイクル](/react/docs/component-specs-ja-JP.html)をご覧ください。

### React.createElement

```javascript
ReactElement createElement(
  string/ReactClass type,
  [object props],
  [children ...]
)
```

与えられた型の `ReactElement` を作成し、返します。type引数はhtmlタグ名（例えば、'div'、'span'など）の文字列にも`ReactClass`（`React.createClass` によって作成される）にもなり得ます。

### React.cloneElement

```
ReactElement cloneElement(
  ReactElement element,
  [object props],
  [children ...]
)
```

`element` をスターティングポイントとして使用する新しい `ReactElement` をクローンして返します。
結果として生まれる要素はオリジナルの要素のpropsと新しいpropsを暗にマージしたものを保持しています。新しい子要素は現存する子要素を置き換えます。 `React.addons.cloneWithProps` と異なり、オリジナルの要素から得られた `key` と `ref` は保存されます。（`cloneWithProps` とは異なり）propsをマージする際に特別な動きは行いません。詳細については、[v0.13 RC2 blog記事](/react/blog/2015/03/03/react-v0.13-rc2.html)をご覧ください。

### React.createFactory

```javascript
factoryFunction createFactory(
  string/ReactClass type
)
```

与えられた型のReactElementsを生成する関数を返します。 `React.createElement` と同様に、type引数はhtmlタグ名（例えば、'div'、'span'など）の文字列にも`ReactClass` にもなり得ます。

### React.render

```javascript
ReactComponent render(
  ReactElement element,
  DOMElement container,
  [function callback]
)
```

与えられた `container` によってReactElementをDOMにレンダリングし、コンポーネントへの参照を返します。

もしReactElementが事前に `container` にレンダリングされていた場合は、更新を行い、DOMが最新のReactのコンポーネントを表すように変化させます。

オプションのコールバックが与えられた場合は、コンポーネントがレンダリングされたり、更新された後に実行されます。

> 注意:
> `React.render()` は渡されたコンテナーノードの内容を制御します。内部に存在するDOM要素は最初に呼ばれた際に置き換えられます。その後に呼ばれた場合は、ReactのDOMの差分アルゴリズムを使用して、効率的に更新されます。
>
> `React.render()` はコンテナーノードの変更は行いません（コンテナの子要素のみ変更を行います）。今後、存在する子要素を上書きすることなく、存在するDOMノードにコンポーネントを挿入することが可能になるでしょう。

### React.unmountComponentAtNode

```javascript
boolean unmountComponentAtNode(DOMElement container)
```

マウントされたReactのコンポーネントをDOMから削除し、そのイベントハンドラとstateをクリーンアップします。コンテナにコンポーネントがマウントされていない場合は、この関数を呼んでも何も行われません。コンポーネントがアンマウントされた場合は `true` を返し、アンマウントするコンポーネントが存在しない場合は `false` を返します。

### React.renderToString

```javascript
string renderToString(ReactElement element)
```

ReactElementを最初にHTMLにレンダリングします。これはサーバでのみ使用されるべきです。ReactはHTML文字列を返します。このメソッドを、サーバでHTMLを生成し、最初のリクエストに対してマークアップを送るのに使用することができます。そうすることで、ページロードが速くなり、サーチエンジンはSEOの目的でページをクロールします。

既にサーバでレンダリングされたマークアップを保持しているノードで `React.render()` を呼んだ場合は、Reactはそれを保護し、イベントハンドラを加えます。そうすることで、最初のローディングのパフォーマンスがとても良くなります。

### React.renderToStaticMarkup

```javascript
string renderToStaticMarkup(ReactElement element)
```

`renderToString` に似ていますが、Reactが内部で使用する `data-react-id` のような外部のDOM属性を作成しません。Reactを、単純な静的なページを生成するために使用したい場合は有用です。外部の属性を取り除くことでメモリを節約することができます。

### React.isValidElement

```javascript
boolean isValidElement(* object)
```

オブジェクトがReactElementであるかどうか調査します。

### React.findDOMNode

```javascript
DOMElement findDOMNode(ReactComponent component)
```

このコンポーネントがDOMにマウントされた場合は、対応するネイティブブラウザのDOM要素を返します。このメソッドはDOMの外の値を読み込む場合に有用です。例えば、formフィールドの値やDOMの測定を行う場合があります。 `render` が `null` や `false` を返した場合は、 `findDOMNode` は `null` を返します。

### React.DOM

`React.DOM` はDOMコンポーネントのための `React.createElement` の周りの便利なラッパーを提供します。JSXを使用しない場合にのみ使用すべきです。例えば、 `React.DOM.div(null, 'Hello World!')` のように。

### React.PropTypes

`React.PropTypes` はコンポーネントに与えられたpropsをバリデーションするためにコンポーネントの `propTypes` と使用できる型を含んでいます。 `propTypes` についての更なる情報は、[再利用可能なコンポーネント](/react/docs/reusable-components-ja-JP.html)をご覧ください。

### React.Children

`React.Children` は `this.props.children` の不透明なデータ構造を扱うユーティリティを提供します。

#### React.Children.map

```javascript
object React.Children.map(object children, function fn [, object thisArg])
```

全ての `children` を含む子要素に対して、 `fn` を実行します。 `this` は `thisArg` にセットされます。 `children` がネストしたオブジェクトや配列だった場合は、実行されません。 `fn` はコンテナのオブジェクトから渡されません。子要素が `null` か `undefined` だった場合は、空のオブジェクトではなく `null` か `undefined` を返します。

#### React.Children.forEach

```javascript
React.Children.forEach(object children, function fn [, object thisArg])
```

`React.Children.map()` に似ていますが、オブジェクトを返しはしません。

#### React.Children.count

```javascript
number React.Children.count(object children)
```

`children` の中のコンポーネントの合計数を返します。 `map` や `forEach` に渡されるコールバックが実行される数と等しくなります。

#### React.Children.only

```javascript
object React.Children.only(object children)
```

`children` の単一の子要素を返します。それ以外の場合は例外をスローします。
