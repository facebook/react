# [React](https://react.dev/) &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/facebook/react/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/react.svg?style=flat)](https://www.npmjs.com/package/react) [![(Runtime) Build and Test](https://github.com/facebook/react/actions/workflows/runtime_build_and_test.yml/badge.svg)](https://github.com/facebook/react/actions/workflows/runtime_build_and_test.yml) [![(Compiler) TypeScript](https://github.com/facebook/react/actions/workflows/compiler_typescript.yml/badge.svg?branch=main)](https://github.com/facebook/react/actions/workflows/compiler_typescript.yml) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://legacy.reactjs.org/docs/how-to-contribute.html#your-first-pull-request)

React é uma biblioteca JavaScript para construção de interfaces de usuário.

* **Declarativo:** React torna a criação de UIs interativas simples. Projete vistas simples para cada estado em sua aplicação, e o React atualizará e renderizará de forma eficiente os componentes corretos quando seus dados mudarem. Vistas declarativas tornam seu código mais previsível, mais fácil de entender e de depurar.
* **Baseado em Componentes:** Construa componentes encapsulados que gerenciam seu próprio estado, e então componha-os para criar UIs complexas. Como a lógica dos componentes é escrita em JavaScript ao invés de templates, você pode facilmente passar dados ricos através do seu aplicativo e manter o estado fora do DOM.
* **Aprenda uma vez, escreva em qualquer lugar:** Não fazemos suposições sobre o restante da sua pilha tecnológica, então você pode desenvolver novas funcionalidades em React sem reescrever código existente. React também pode renderizar no servidor usando [Node](https://nodejs.org/en) e oferecer suporte a aplicativos móveis usando [React Native](https://reactnative.dev/).

[Saiba como usar o React em seu projeto](https://react.dev/learn).

## Instalação

React foi projetado para adoção gradual desde o início, e **você pode usar tanto ou tão pouco do React quanto precisar:**

* Use o [Começo Rápido](https://react.dev/learn) para experimentar o React.
* [Adicione React a um Projeto Existente](https://react.dev/learn/add-react-to-an-existing-project) para usar tanto ou tão pouco React quanto precisar.
* [Crie um Novo App React](https://react.dev/learn/start-a-new-react-project) se você estiver procurando por uma poderosa ferramenta de JavaScript.

## Documentação

Você pode encontrar a documentação do React [no site](https://react.dev/).

Confira a página [Começo Rápido](https://react.dev/learn) para uma visão geral rápida.

A documentação está dividida em várias seções:

* [Começo Rápido](https://react.dev/learn)
* [Tutorial](https://react.dev/learn/tutorial-tic-tac-toe)
* [Pensando em React](https://react.dev/learn/thinking-in-react)
* [Instalação](https://react.dev/learn/installation)
* [Descrevendo a UI](https://react.dev/learn/describing-the-ui)
* [Adicionando Interatividade](https://react.dev/learn/adding-interactivity)
* [Gerenciando Estado](https://react.dev/learn/managing-state)
* [Guias Avançados](https://react.dev/learn/escape-hatches)
* [Referência de API](https://react.dev/reference/react)
* [Onde Obter Suporte](https://react.dev/community)
* [Guia de Contribuição](https://legacy.reactjs.org/docs/how-to-contribute.html)

Você pode melhorar a documentação enviando solicitações de pull para [este repositório](https://github.com/reactjs/react.dev).

## Exemplos

Temos vários exemplos [no site](https://react.dev/). Aqui está o primeiro para começar:

```jsx
import { createRoot } from 'react-dom/client';

function HelloMessage({ name }) {
  return <div>Hello {name}</div>;
}

const root = createRoot(document.getElementById('container'));
root.render(<HelloMessage name="Taylor" />);
```

Este exemplo renderizará "Hello Taylor" em um contêiner na página.

Você notará que usamos uma sintaxe semelhante a HTML; [nós a chamamos de JSX](https://react.dev/learn#writing-markup-with-jsx). JSX não é obrigatório para usar React, mas torna o código mais legível e escrever parece como escrever HTML.

## Contribuindo

O principal objetivo deste repositório é continuar evoluindo o núcleo do React, tornando-o mais rápido e fácil de usar. O desenvolvimento do React ocorre de forma aberta no GitHub, e somos gratos à comunidade por contribuir com correções de bugs e melhorias. Leia abaixo para aprender como você pode participar na melhoria do React.

### [Código de Conduta](https://code.fb.com/codeofconduct)

O Facebook adotou um Código de Conduta que esperamos que os participantes do projeto sigam. Por favor, leia [o texto completo](https://code.fb.com/codeofconduct) para entender quais ações serão e não serão toleradas.

### [Guia de Contribuição](https://legacy.reactjs.org/docs/how-to-contribute.html)

Leia nosso [guia de contribuição](https://legacy.reactjs.org/docs/how-to-contribute.html) para aprender sobre nosso processo de desenvolvimento, como propor correções de bugs e melhorias, e como construir e testar suas alterações no React.

### [Problemas Fáceis para Iniciantes](https://github.com/facebook/react/labels/good%20first%20issue)

Para ajudar você a começar e se familiarizar com nosso processo de contribuição, temos uma lista de [problemas fáceis para iniciantes](https://github.com/facebook/react/labels/good%20first%20issue) que contêm bugs com escopo relativamente limitado. Este é um ótimo lugar para começar.

### Licença

React está licenciado sob a [Licença MIT](./LICENSE).
