---
id: tooling-integration
title: インテグレーションツール
permalink: tooling-integration-ja-JP.html
prev: more-about-refs-ja-JP.html
next: addons-ja-JP.html
---

全てのプロジェクトがJavaScriptをビルドしたりデプロイするのに様々なシステムを使用しています。私たちはReactをできるだけ環境不問にしようとしています。

## React

### CDNにホストされたReact

[ダウンロードページ](/react/downloads.html)でCDNにホストされたバージョンのReactが提供されています。それらの、事前にビルドされたファイルはUMDモジュールフォーマットを使用しています。簡単な `<script>` タグを使ってそれらを導入することで、あなたの環境でグローバルに `React` を使うことができます。CommonJSの外や、AMDの環境でも、それは動作するでしょう。

### masterを使う

[GitHubリポジトリに](https://github.com/facebook/react) `master` からビルドする説明が書いてあります。`build/modules` の下にCommonJSモジュールのツリーをビルドします。それらは、どんな環境やCommonJSがサポートされているパッケージングツールでも導入できます。

## JSX

### ブラウザ上でのJSXの変換

JSXを使用したい場合、[ダウンロードページに](/react/downloads.html)開発のためにブラウザ上でのJSXトランスフォーマーを提供しています。単純に `<script type="text/jsx">` をインクルードすることでJSXトランスフォーマーを使用できます。

> 注意:
> ブラウザ上でのJSXトランスフォーマーをとても大きく、避けることのできるクライアントサイドの計算になりかねません。プロダクションでは使わないでください。詳細は次のセクションをご覧ください。

### プロダクションで使う場合:事前にコンパイルされたJSX

[npm](https://www.npmjs.com/)がインストールされている場合、コマンドラインの `jsx` ツールは単純に `npm install -g react-tools` コマンドを流せばインストールできます。このツールはJSXを使用しているファイルを直接ブラウザ上で動く生のJavaScriptファイルに変換します。また、ディレクトリをウォッチして、ファイルが変更されたら自動的に変換を行います。例えば、次のようなコマンドで。 `jsx --watch src/ build/`

デフォルトで、拡張子が `.js` のJSXファイルは変換されます。拡張子が `.jsx` のファイルを変換するには `jsx --extension jsx src/ build/` コマンドを使用してください。

このツールの使用方法についての詳細の情報については、 `jsx --help` コマンドを使用してください。


### 役に立つオープンソースのプロジェクト

オープンソースコミュニティがJSXをいくつかのエディタやビルドシステムで使用するためのツールを作成しました。一覧は[JSXのインテグレーション](https://github.com/facebook/react/wiki/Complementary-Tools#jsx-integrations)を参照してください。
