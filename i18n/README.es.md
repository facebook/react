# [React](https://react.dev/) &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/facebook/react/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/react.svg?style=flat)](https://www.npmjs.com/package/react) [![(Runtime) Build and Test](https://github.com/facebook/react/actions/workflows/runtime_build_and_test.yml/badge.svg)](https://github.com/facebook/react/actions/workflows/runtime_build_and_test.yml) [![(Compiler) TypeScript](https://github.com/facebook/react/actions/workflows/compiler_typescript.yml/badge.svg?branch=main)](https://github.com/facebook/react/actions/workflows/compiler_typescript.yml) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://legacy.reactjs.org/docs/how-to-contribute.html#your-first-pull-request)

React es una biblioteca de JavaScript para construir interfaces de usuario.

* **Declarativo:** React facilita la creación de interfaces de usuario interactivas. Diseña vistas simples para cada estado de tu aplicación, y React actualizará y renderizará de manera eficiente los componentes correctos cuando los datos cambien. Las vistas declarativas hacen que tu código sea más predecible, más fácil de entender y de depurar.
* **Basado en componentes:** Crea componentes encapsulados que gestionen su propio estado y compón estos para crear interfaces de usuario complejas. Dado que la lógica de los componentes está escrita en JavaScript en lugar de plantillas, puedes pasar datos enriquecidos fácilmente a través de tu aplicación y mantener el estado fuera del DOM.
* **Aprende una vez, escribe en cualquier lugar:** No hacemos suposiciones sobre el resto de tu tecnología, por lo que puedes desarrollar nuevas características en React sin reescribir el código existente. React también puede renderizar en el servidor usando [Node](https://nodejs.org/en) y potenciar aplicaciones móviles usando [React Native](https://reactnative.dev/).

[Aprende cómo usar React en tu proyecto](https://react.dev/learn).

## Instalación

React ha sido diseñado para una adopción gradual desde el principio, y **puedes usar tan poco o tanto React como necesites:**

* Usa [Inicio rápido](https://react.dev/learn) para probar React.
* [Añade React a un proyecto existente](https://react.dev/learn/add-react-to-an-existing-project) para usar tan poco o tanto React como necesites.
* [Crea una nueva aplicación React](https://react.dev/learn/start-a-new-react-project) si buscas una poderosa herramienta de JavaScript.

## Documentación

Puedes encontrar la documentación de React [en el sitio web](https://react.dev/).

Consulta la página [Inicio rápido](https://react.dev/learn) para una visión general rápida.

La documentación está dividida en varias secciones:

* [Inicio rápido](https://react.dev/learn)
* [Tutorial](https://react.dev/learn/tutorial-tic-tac-toe)
* [Pensando en React](https://react.dev/learn/thinking-in-react)
* [Instalación](https://react.dev/learn/installation)
* [Describiendo la interfaz de usuario](https://react.dev/learn/describing-the-ui)
* [Agregando interactividad](https://react.dev/learn/adding-interactivity)
* [Gestionando el estado](https://react.dev/learn/managing-state)
* [Guías avanzadas](https://react.dev/learn/escape-hatches)
* [Referencia de API](https://react.dev/reference/react)
* [Dónde obtener soporte](https://react.dev/community)
* [Guía de contribución](https://legacy.reactjs.org/docs/how-to-contribute.html)

Puedes mejorar la documentación enviando solicitudes de extracción a [este repositorio](https://github.com/reactjs/react.dev).

## Ejemplos

Tenemos varios ejemplos [en el sitio web](https://react.dev/). Aquí está el primero para comenzar:

```jsx
import { createRoot } from 'react-dom/client';

function HelloMessage({ name }) {
  return <div>Hello {name}</div>;
}

const root = createRoot(document.getElementById('container'));
root.render(<HelloMessage name="Taylor" />);
```

Este ejemplo renderizará "Hello Taylor" en un contenedor en la página.

Notarás que usamos una sintaxis similar a HTML; [la llamamos JSX](https://react.dev/learn#writing-markup-with-jsx). JSX no es obligatorio para usar React, pero hace que el código sea más legible y escribirlo se siente como escribir HTML.

## Contribución

El propósito principal de este repositorio es continuar evolucionando el núcleo de React, haciéndolo más rápido y fácil de usar. El desarrollo de React ocurre abiertamente en GitHub, y estamos agradecidos con la comunidad por contribuir con correcciones de errores y mejoras. Lee a continuación para aprender cómo puedes participar en mejorar React.

### [Código de conducta](https://code.fb.com/codeofconduct)

Facebook ha adoptado un código de conducta que esperamos que los participantes del proyecto sigan. Por favor, lee [el texto completo](https://code.fb.com/codeofconduct) para entender qué acciones se permitirán y cuáles no.

### [Guía de contribución](https://legacy.reactjs.org/docs/how-to-contribute.html)

Lee nuestra [guía de contribución](https://legacy.reactjs.org/docs/how-to-contribute.html) para aprender sobre nuestro proceso de desarrollo, cómo proponer correcciones de errores y mejoras, y cómo construir y probar tus cambios en React.

### [Problemas para principiantes](https://github.com/facebook/react/labels/good%20first%20issue)

Para ayudarte a empezar y familiarizarte con nuestro proceso de contribución, tenemos una lista de [problemas para principiantes](https://github.com/facebook/react/labels/good%20first%20issue) que contienen errores con un alcance relativamente limitado. Este es un excelente punto de partida.

### Licencia

React tiene licencia bajo [MIT](./LICENSE).
