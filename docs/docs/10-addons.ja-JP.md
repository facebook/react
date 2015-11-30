---
id: addons
title: アドオン
permalink: addons-ja-JP.html
prev: tooling-integration-ja-JP.html
next: animation-ja-JP.html
---

`React.addons` はReactのアプリケーションを作成する上で便利なユーティリティを置いておくための場所です。 **それらは実験的なものであると考えられるべきです。** しかし、ゆくゆくはコアに入ってくるか、以下のような承認されたユーティリティとなるでしょう。

- アニメーションや推移を扱う[`TransitionGroup` や `CSSTransitionGroup`](animation-ja-JP.html)は多くの場合実行するのが簡単ではありません。例えば、コンポーネントの削除の前などは。
- [`LinkedStateMixin`](two-way-binding-helpers-ja-JP.html)はユーザのフォームの入力データとコンポーネントのstateの間の調整を単純化します。
- [`cloneWithProps`](clone-with-props-ja-JP.html)はReactのコンポーネントのシャローコピーを作成したり、それらのpropsを変更したりします。
- [`createFragment`](create-fragment-ja-JP.html)は外部のキー化された子要素のセットを作成します。
- [`update`](update-ja-JP.html)はJavaScriptでイミュータブルなデータを扱うことを簡単にするヘルパーの関数です。
- [`PureRenderMixin`](pure-render-mixin-ja-JP.html)は特定のシチュエーションでパフォーマンスを改善します。
以下のアドオンはReactだけの開発版（縮小されていない版）です。

- [`TestUtils`](test-utils-ja-JP.html)はテストケースを記述する単純なヘルパーです（縮小されていないビルドのみ）。
- [`Perf`](perf-ja-JP.html)はパフォーマンスを測り、どこを最適化するかのヒントを与えます。

アドオンを使うには、共通の `react.js` を使うよりも `react-with-addons.js` （とその縮小されたもの）を使ってください。

npmからReactのパッケージを使う際には、Reactと全てのアドオンを使うために `require('react')` を使う代わりに、単純に `require('react/addons')` を使ってください。
