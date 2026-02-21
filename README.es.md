# [React](https://react.dev/) &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/facebook/react/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/react.svg?style=flat)](https://www.npmjs.com/package/react) [![(Runtime) Build and Test](https://github.com/facebook/react/actions/workflows/runtime_build_and_test.yml/badge.svg)](https://github.com/facebook/react/actions/workflows/runtime_build_and_test.yml) [![(Compiler) TypeScript](https://github.com/facebook/react/actions/workflows/compiler_typescript.yml/badge.svg?branch=main)](https://github.com/facebook/react/actions/workflows/compiler_typescript.yml) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://legacy.reactjs.org/docs/how-to-contribute.html#your-first-pull-request)

React es una biblioteca de JavaScript para crear interfaces de usuario.

* **Declarativo:** React hace que sea fácil y sin dolor crear UIs interactivas. Diseña vistas simples para cada estado de tu aplicación, y React se encargará de actualizar y renderizar eficientemente solo los componentes necesarios cuando tus datos cambien. Las vistas declarativas hacen que tu código sea más predecible, más fácil de entender y de depurar.
* **Basado en Componentes:** Crea componentes encapsulados que manejen su propio estado, y luego compónlos para crear UIs complejas. Como la lógica de los componentes está escrita en JavaScript en lugar de templates, puedes pasar datos complejos fácilmente a través de tu app y mantener el estado fuera del DOM.
* **Aprende una vez, escribe donde sea:** No hacemos suposiciones sobre el resto de tu stack tecnológico, así que puedes desarrollar nuevas funcionalidades en React sin reescribir código existente. React también puede renderizar en el servidor usando [Node](https://nodejs.org/en) y potenciar aplicaciones móviles usando [React Native](https://reactnative.dev/).

[Aprende cómo usar React en tu proyecto](https://react.dev/learn).

## Instalación

React ha sido diseñado desde el inicio para una adopción gradual, y **puedes usar tan poco o tanto React como necesites**:

* Usa [Quick Start](https://react.dev/learn) para probar React.
* [Agrega React a un Proyecto Existente](https://react.dev/learn/add-react-to-an-existing-project) para usar tanto o tan poco React como necesites.
* [Crea una Nueva App de React](https://react.dev/learn/start-a-new-react-project) si buscas un toolchain de JavaScript potente.

## Documentación

Puedes encontrar la documentación de React [en el sitio web](https://react.dev/).

Revisa la página de [Primeros Pasos](https://react.dev/learn) para un resumen rápido.

La documentación está dividida en varias secciones:

* [Quick Start](https://react.dev/learn)
* [Tutorial](https://react.dev/learn/tutorial-tic-tac-toe)
* [Pensando en React](https://react.dev/learn/thinking-in-react)
* [Instalación](https://react.dev/learn/installation)
* [Describiendo la UI](https://react.dev/learn/describing-the-ui)
* [Agregando Interactividad](https://react.dev/learn/adding-interactivity)
* [Gestionando Estado](https://react.dev/learn/managing-state)
* [Guías Avanzadas](https://react.dev/learn/escape-hatches)
* [Referencia del API](https://react.dev/reference/react)
* [Dónde Obtener Soporte](https://react.dev/community)
* [Guía de Contribución](https://legacy.reactjs.org/docs/how-to-contribute.html)

Puedes mejorarla enviando pull requests a [este repositorio](https://github.com/reactjs/react.dev).

## Ejemplos

Tenemos varios ejemplos [en el sitio web](https://react.dev/). Este es el primero para que puedas empezar:

```jsx
import { createRoot } from 'react-dom/client';

function HelloMessage({ name }) {
  return <div>Hello {name}</div>;
}

const root = createRoot(document.getElementById('container'));
root.render(<HelloMessage name="Taylor" />);
```

Este ejemplo renderizará "Hello Taylor" en un contenedor en la página.

Notarás que usamos una sintaxis parecida a HTML; [la llamamos JSX](https://react.dev/learn#writing-markup-with-jsx). JSX no es requerido para usar React, pero hace el código más legible, y escribirlo se siente como escribir HTML.

## Contribuir

El propósito principal de este repositorio es continuar evolucionando el core de React, haciéndolo más rápido y fácil de usar. El desarrollo de React ocurre abiertamente en GitHub, y estamos agradecidos con la comunidad por contribuir con correcciones de bugs y mejoras. Lee a continuación para aprender cómo puedes participar en mejorar React.

### [Código de Conducta](https://code.fb.com/codeofconduct)

Facebook ha adoptado un Código de Conducta que esperamos que los participantes del proyecto cumplan. Por favor lee [el texto completo](https://code.fb.com/codeofconduct) para que puedas entender qué acciones serán y no serán toleradas.

### [Guía de Contribución](https://legacy.reactjs.org/docs/how-to-contribute.html)

Lee nuestra [guía de contribución](https://legacy.reactjs.org/docs/how-to-contribute.html) para aprender sobre nuestro proceso de desarrollo, cómo proponer correcciones de bugs y mejoras, y cómo construir y testear tus cambios a React.

### [Good First Issues](https://github.com/facebook/react/labels/good%20first%20issue)

Para ayudarte a empezar y familiarizarte con nuestro proceso de contribución, tenemos una lista de [good first issues](https://github.com/facebook/react/labels/good%20first%20issue) que contienen bugs con un alcance relativamente limitado. Este es un gran lugar para comenzar.

### Licencia

React está bajo [licencia MIT](./LICENSE).
