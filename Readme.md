LÉAME.md
reaccionar ·licencia GitHub versión npm CírculoEstado de CI Bienvenida a los RR.PP.
React es una biblioteca de JavaScript para crear interfaces de usuario.

Declarativo: React hace que sea sencillo crear interfaces de usuario interactivas. Diseñe vistas simples para cada estado en su aplicación, y React actualizará y renderizará de manera eficiente solo los componentes correctos cuando cambien sus datos. Las vistas declarativas hacen que su código sea más predecible, más fácil de entender y más fácil de depurar.
Basado en componentes: construya componentes encapsulados que administren su propio estado, luego compóngalos para crear interfaces de usuario complejas. Dado que la lógica del componente está escrita en JavaScript en lugar de plantillas, puede pasar fácilmente datos enriquecidos a través de su aplicación y mantener el estado fuera del DOM.
Aprenda una vez, escriba en cualquier lugar: no hacemos suposiciones sobre el resto de su pila de tecnología, por lo que puede desarrollar nuevas funciones en React sin tener que volver a escribir el código existente. React también puede renderizar en el servidor usando Node y potenciar aplicaciones móviles usando React Native .
Aprende a usar React en tu proyecto .

Instalación
React ha sido diseñado para una adopción gradual desde el principio, y puede usar tanto React como necesite :

Usa Online Playgrounds para probar React.
Agregue React a un sitio web como una <script>etiqueta en un minuto.
Cree una nueva aplicación React si está buscando una potente cadena de herramientas de JavaScript.
Puede usar React como una <script>etiqueta desde un CDN o como un reactpaquete en npm .

Documentación
Puede encontrar la documentación de React en el sitio web .

Consulte la página Introducción para obtener una descripción general rápida.

La documentación se divide en varias secciones:

Tutorial
Conceptos principales
Guías Avanzadas
Referencia de la API
Dónde obtener soporte
Guía colaboradora
Puede mejorarlo enviando solicitudes de incorporación de cambios a este repositorio .

Ejemplos
Tenemos varios ejemplos en el sitio web . Aquí está el primero para empezar:

import { createRoot } from 'react-dom/client';

function HelloMessage({ name }) {
  return <div>Hello {name}</div>;
}

const root = createRoot(document.getElementById('container'));
root.render(<HelloMessage name="Taylor" />);
Este ejemplo mostrará "Hello Taylor" en un contenedor en la página.

Notarás que usamos una sintaxis similar a HTML; lo llamamos JSX . No se requiere JSX para usar React, pero hace que el código sea más legible y escribirlo se siente como escribir HTML. Si está utilizando React como <script>etiqueta, lea esta sección sobre la integración de JSX; de lo contrario, las cadenas de herramientas de JavaScript recomendadas lo manejan automáticamente.

contribuyendo
El propósito principal de este repositorio es continuar evolucionando el núcleo de React, haciéndolo más rápido y fácil de usar. El desarrollo de React ocurre abiertamente en GitHub, y estamos agradecidos con la comunidad por contribuir con correcciones de errores y mejoras. Lea a continuación para saber cómo puede participar en la mejora de React.

Código de conducta
Facebook ha adoptado un Código de conducta que esperamos que cumplan los participantes del proyecto. Lea el texto completo para que pueda comprender qué acciones se tolerarán y cuáles no.

Guía colaboradora
Lea nuestra guía de contribución para conocer nuestro proceso de desarrollo, cómo proponer correcciones de errores y mejoras, y cómo crear y probar sus cambios en React.

Buenos primeros números
Para ayudarlo a familiarizarse con nuestro proceso de contribución, tenemos una lista de buenos primeros problemas que contienen errores que tienen un alcance relativamente limitado. Este es un gran lugar para empezar.

Licencia
React tiene licencia del MIT .
