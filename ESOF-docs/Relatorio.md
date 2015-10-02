# Relatório ESOF
## Facebook/React

### Descrição do Projeto

React é uma biblioteca em JavaScript para a criação de interfaces gráficas para o utilizador mantida pelo Facebook, Instagram e por uma comunidade de colaboradores individuais e corporações.

Grande parte da comunidade opta por tratar este projeto como o V de MVC, ou seja, como a visão da representação da informação no padrão de arquitetura de software Model-View-Controller, refutando categoricamente que React seja uma framework MVC.

O projeto mantém uma virtual DOM - Document Object Model, uma multiplataforma independente da linguagem para a representação e interação com objetos em documentos HTML, XHTML e XML. Isto permite oferecer um simples modelo de programação e uma melhor performance.

React pode ainda processar no servidor usando Node - um interpretador de código JavaScript que funciona do lado do servidor - e pode ainda carregar aplicações nativas usando a framework React Native.

Esta biblioteca é um dos primeiros projetos open source do Facebook que se encontra em constante desenvolvimento e é utilizado para enviar código para todos na página do Facebook. Os colaboradores continuam a trabalhar para tornar a contribuição para o projeto o mais fácil e transparente possível.

React foi criado para resolver um único problema: construir um grande número de aplicações com informação que muda ao longo do tempo.


### Processo de Desenvolvimento

O desenvolvimento da biblioteca React segue uma filosofia tipicamente Agile, constituindo-se como um processo focado na evolução contínua do software, com novas versões a ser lançadas, albergando novas funcionalidades, à medida que novos requisitos são determinados a partir do feedback dos utilizadores e da vontade dos próprios colaboradores do projeto.

No momento em que este relatório é redigido, o projeto encontra-se muito ativo, com uma média de 28,23 commits por semana, desde a semana com início a 5 de outubro de 2014 até à semana com início a 27 de setembro de 2015, e um total de mais de 5400 commits.

![Commits por semana do projeto React](./commits_graph.jpg)

Esta grande variedade de commits suporta a tese de que o projeto segue um processo Agile, com constantes adaptações e correções do código, adição de funcionalidades, evolução do sistema e refactoring.

Contudo, apesar da interpretação Na realidade, o projeto React não é um projeto único, mas antes uma coleção de [múltiplos projetos](https://github.com/facebook/react/wiki/Projects) interdependentes, cada um dos quais relacionado com um dado componente da biblioteca ou um conjunto de funcionalidades que necessitam de ser trabalhadas ou testadas. Uma vez que este facto poderia causar problemas de organização do repositório, um destes projetos, intitulado [Better Project Distinction](https://github.com/facebook/react/wiki/Projects#better-project-distinction), consiste precisamente organizar o projeto global da forma mais clara possível, distinguindo as funcionalidades dos vários projetos. Nas palavras de 

> With multiple interdependent projects in the same repo, we have a bit of a mess. I don’t think it hurts much to have these things together, but we should make this as clear as possible.

[Paul O'Shannessy](https://github.com/zpao), um dos principais colaboradores no desenvolvimento do React e responsável pela tarefa de distinção entre os projetos.



### Análise Crítica

O projecto em estudo pelos autores deste relatório sofre múltiplas contribuições por parte de vários programadores, provenientes da core team ou qualquer pessoa que deseje adicionar a sua contribuição ao projecto. Como cada contribuidor possui o seu próprio método de organização e de programação, e sendo este um projecto constituído por vários deles, é essencial o establecimento de determinados padrões, por forma a garantir a organização e o sucesso deste projecto.

Uma das formas que os principais contribuidores do projecto (core team) usam para garantir um processo de desenvolvimento fluído e eficaz é descriminando as várias convenções utilizadas ao longo do código e como deve ser utilizado o repositório.

Todavia, apesar do estabelecimento das regras supramencionadas, podem surgir vários problemas de organização ao nível do repositório, que, em última análise, deterioram o processo de desenvolvimento. Deste modo, verifica-se a importância da existência de um "janitor" que garanta que os vários aspectos de organização são cumpridos e, se não, corrigi-los. 

A análise de um repositório tem em vista não só a sua organização bem como a qualidade e frequência dos commits realizados. 
Quanto à quantidade, pode constatar-se que o projecto é sujeito a várias alterações, como se pode constatar nos vários [gráficos disponibilizados pelo GitHub](https://github.com/facebook/react/graphs/commit-activity). Deste facto, pode deduzir-se que este projecto situa-se numa fase de desenvolvimento bastante activa, e, alem disso, verifica-se que este projecto continua a ser do interesse de várias entidades, quer de contribuidores, quer de várias [organizações](https://github.com/facebook/react/wiki/Sites-Using-React).
Quanto à qualidade dos mesmos, a análise poderá ser mais subjectiva que a anterior. 
