Reaccionar ·Licencia de GitHub versión npm Estado de CircleCI Relaciones públicas bienvenidos
React es una biblioteca de JavaScript para crear interfaces de usuario.

Declarativo: React facilita la creación de interfaces de usuario interactivas. Diseñe vistas simples para cada estado en su aplicación, y React actualizará y renderizará de manera eficiente los componentes correctos cuando sus datos cambien. Las vistas declarativas hacen que su código sea más predecible, más simple de entender y más fácil de depurar.
Basado en componentes: cree componentes encapsulados que administren su propio estado y luego compóngalos para crear interfaces de usuario complejas. Dado que la lógica de los componentes está escrita en JavaScript en lugar de en plantillas, puede pasar fácilmente datos enriquecidos a través de su aplicación y mantener el estado fuera del DOM.
Aprenda una vez, escriba en cualquier lugar: No hacemos suposiciones sobre el resto de su pila de tecnología, por lo que puede desarrollar nuevas funciones en React sin reescribir el código existente. React también puede renderizar en el servidor usando Node y potenciar aplicaciones móviles usando React Native .
Aprenda a usar React en su propio proyecto .

Instalación
React ha sido diseñado para una adopción gradual desde el principio, y puede usar tanto React como necesite :

Usa los patios de juegos en línea para probar React.
Agregue React to a Website como <script>etiqueta en un minuto.
Cree una nueva aplicación React si está buscando una poderosa cadena de herramientas de JavaScript.
Puede usar React como una <script>etiqueta de un CDN o como un reactpaquete en npm .

Documentación
Puede encontrar la documentación de React en el sitio web .

Consulte la página de introducción para obtener una descripción general rápida.

La documentación se divide en varias secciones:

Tutorial
Conceptos principales
Guías avanzadas
Referencia de API
Dónde obtener soporte
Guía contribuyente
Puede mejorarlo enviando solicitudes de extracción a este repositorio .

Ejemplos de
Tenemos varios ejemplos en el sitio web . Aquí está el primero para comenzar:

function  HelloMessage ( { nombre } )  { 
  return  < div > Hola { nombre } < / div > ; 
}

ReactDOM . render ( 
  < HelloMessage  name = "Taylor"  / > , 
  document . getElementById ( 'contenedor' ) 
) ;
Este ejemplo representará "Hello Taylor" en un contenedor en la página.

Notará que usamos una sintaxis similar a HTML; lo llamamos JSX . JSX no es necesario para usar React, pero hace que el código sea más legible y escribirlo se siente como escribir HTML. Si está utilizando React como <script>etiqueta, lea esta sección sobre la integración de JSX; de lo contrario, las cadenas de herramientas de JavaScript recomendadas lo manejan automáticamente.

Contribuyendo
El propósito principal de este repositorio es continuar evolucionando el núcleo de React, haciéndolo más rápido y fácil de usar. El desarrollo de React ocurre al aire libre en GitHub, y estamos agradecidos con la comunidad por contribuir con correcciones de errores y mejoras. Lea a continuación para saber cómo puede participar en la mejora de React.

Código de conducta
Facebook ha adoptado un Código de conducta que esperamos que cumplan los participantes del proyecto. Lea el texto completo para comprender qué acciones se tolerarán y cuáles no.

Guía contribuyente
Lea nuestra guía de contribución para conocer nuestro proceso de desarrollo, cómo proponer correcciones de errores y mejoras, y cómo construir y probar sus cambios en React.

Buenos primeros números
Para ayudarlo a mojarse los pies y familiarizarse con nuestro proceso de contribución, tenemos una lista de buenos primeros números que contienen errores que tienen un alcance relativamente limitado. Este es un gran lugar para comenzar.

Licencia
React tiene licencia del MIT .
