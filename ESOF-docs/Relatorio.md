# Relatório ESOF
## Facebook/React

### Descrição do Projeto

React é uma biblioteca em JavaScript para a criação de interfaces gráficas para o utilizador mantida pelo Facebook, Instagram e por uma comunidade de colaboradores individuais e corporações.

Grande parte da comunidade opta por tratar este projeto como o *V* de *MVC*, ou seja, como a visão da representação da informação no padrão de arquitetura de software *Model-View-Controller*, refutando categoricamente que React seja uma *framework MVC*.

O projeto mantém uma *virtual DOM - Document Object Model*, uma multiplataforma independente da linguagem para a representação e interação com objetos em documentos *HTML*, *XHTML* e *XML*. Isto permite oferecer um simples modelo de programação e uma melhor performance.

React pode ainda processar no servidor usando *Node* - um interpretador de código JavaScript que funciona do lado do servidor - e pode ainda carregar aplicações nativas usando a *framework* React Native.

Esta biblioteca é um dos primeiros projetos *open source* do Facebook que se encontra em constante desenvolvimento e é utilizado para enviar código para todos na página do Facebook. Os colaboradores continuam a trabalhar para tornar a contribuição para o projeto o mais fácil e transparente possível.

Um grande número de páginas e aplicações usam o React, como visível nesta [lista](https://github.com/facebook/react/wiki/Sites-Using-React).

React foi criado para resolver um único problema: construir um grande número de aplicações com informação que muda ao longo do tempo.

A versão atual disponível da biblioteca é a [0.13.3] (https://github.com/facebook/react/issues?q=milestone%3A0.13.3).

### Processo de Desenvolvimento

O desenvolvimento da biblioteca React segue uma filosofia tipicamente Agile, constituindo-se como um processo focado na evolução contínua do software, com novas versões a ser lançadas, albergando novas funcionalidades, à medida que novos requisitos são determinados a partir do *feedback* dos utilizadores e da vontade dos próprios colaboradores do projeto.

No momento em que este relatório é redigido, o projeto encontra-se muito ativo, com uma média de 28,23 commits por semana, desde a semana com início a 5 de outubro de 2014 até à semana com início a 27 de setembro de 2015, e um total de mais de 5400 commits.

![Commits por semana do projeto React](./commits_graph.jpg)

Esta grande variedade de commits suporta a tese de que o projeto segue uma metodologia Agile, com constantes adaptações e correções do código, adição de funcionalidades, evolução do sistema e refactoring. Contudo, apesar da interpretação dos autores deste relatório acerca da filosofia de base que rege o desenvolvimento da biblioteca React, não parece haver um único processo de desenvolvimento bem definido, mas antes um conjunto de práticas associadas a processos Agile, como Scrum e XP, seguidas pelos colaboradores do projeto.

Na realidade, o projeto React não é um projeto único, mas antes uma coleção de [múltiplos projetos](https://github.com/facebook/react/wiki/Projects) interdependentes, cada um dos quais relacionado com um dado componente da biblioteca ou um conjunto de funcionalidades que necessitam de ser trabalhadas ou testadas. Uma vez que este facto poderia causar problemas de organização do repositório, um destes projetos, intitulado [Better Project Distinction](https://github.com/facebook/react/wiki/Projects#better-project-distinction), consiste precisamente organizar o projeto global da forma mais clara possível, distinguindo as funcionalidades dos vários projetos.

> With multiple interdependent projects in the same repo, we have a bit of a mess. I don’t think it hurts much to have these things together, but we should make this as clear as possible.

Estas palavras pertencem [Paul O'Shannessy](https://github.com/zpao), um dos principais colaboradores no desenvolvimento do React e responsável pela tarefa de distinção entre os projetos. Apesar de, aparentemente, existir a possibilidade de os colaboradores do projeto se depararem com algumas dificuldades na orientação do seu trabalho, a equipa central do projeto, designada de *core team*, realiza [reuniões frequentes](https://discuss.reactjs.org/c/meeting-notes), espaçadas de uma a duas semanas, onde são definidos os objetivos para o período entre uma reunião e a reunião seguinte, seguindo um conceito semelhante ao de um *sprint* no processo *Scrum*.

O conjunto de objetivos que são definidos nestas reuniões podem ser sugeridos pelos elementos da *core team* ou escolhidos a partir de uma [lista de *issues*](https://github.com/facebook/react/issues). Esta lista é alimentada por colaboradores do projeto ou por utilizadores da biblioteca e cada item pode dizer respeito a uma funcionalidade que o seu autor deseja ver incluída no projeto ou a um *bug* encontrado. Cada *issue* pode ter associada uma categoria do projeto (e.g., *Component Addons / TestUtils*), ou ser assinalado como *good first bug*, se assinalar um dado problema pela primeira vez.

O projeto também define várias [*milestones*](https://github.com/facebook/react/milestones), isto é, um conjunto maior de objetivos e funcionalidades a atingir a médio-longo prazo. Na prática, cada *milestone* corresponde a uma versão da biblioteca React. No momento em que este relatório é redigido, a versão mais recente da biblioteca é a versão 0.13, encontrando-se a versão 0.14 em desenvolvimento e a versão 0.15 já com alguns *issues* em aberto. Este trabalho de constante refinamento e evolução do projeto, já com treze versões lançadas desde o seu início, em 2013, é mais uma evidência da metodologia Agile seguida pelos desenvolvedores da biblioteca. Um *milestone* é constituído por um conjunto de *issues* que dizem respeito ao aperfeiçoamento e adição de funcionalidades e correção de *bugs*.

O projeto tem um conjunto de proprietários, a *core team*, e um grupo de 519 colaboradores fixos. No entanto, qualquer membro da comunidade GitHub pode contribuir para o [projeto](https://github.com/facebook/react), devendo, para o efeito, realizar um *fork* do mesmo e, após realizar alterações com alguma significância, solicitar aos proprietários que as incorporem no *branch* principal, através de um *pull request*.

### Análise Crítica

O projeto em estudo pelos autores deste relatório sofre múltiplas contribuições por parte de vários programadores, provenientes da core team ou qualquer pessoa que deseje adicionar a sua contribuição ao projecto. Como cada contribuidor possui o seu próprio método de organização e de programação, e sendo este um projecto constituído por vários deles, é essencial o establecimento de determinados padrões, por forma a garantir a organização e o sucesso deste projecto.

Uma das formas que os principais contribuidores do projecto (core team) usam para garantir um processo de desenvolvimento fluído e eficaz é descriminando as várias convenções utilizadas ao longo do código e como deve ser utilizado o repositório.

Todavia, apesar do estabelecimento das regras supramencionadas, podem surgir vários problemas de organização ao nível do repositório, que, em última análise, deterioram o processo de desenvolvimento. Deste modo, verifica-se a importância da existência de um *janitor* que garanta que os vários aspectos de organização são cumpridos e, se não, corrigi-los. 

A análise de um repositório tem em vista não só a sua organização bem como a qualidade e frequência dos commits realizados. 
Quanto à frequência, pode constatar-se que o projecto é sujeito a várias alterações, como se pode constatar nos vários [gráficos disponibilizados pelo GitHub](https://github.com/facebook/react/graphs/commit-activity). Deste facto, pode deduzir-se que este projecto situa-se numa fase de desenvolvimento bastante activa, e, alem disso, verifica-se que este projecto continua a ser do interesse de várias entidades, quer de contribuidores, quer de várias [organizações](https://github.com/facebook/react/wiki/Sites-Using-React).
Quanto à qualidade dos mesmos, a análise poderá ser mais subjectiva e complicada que a anterior. Verifica-se que, quando o projecto sofre adições de código, sensivelmente, em simultâneo, existe uma eliminação de código em igual parte, como se constata através da [estatística disponibilizada pelo GitHub](https://github.com/facebook/react/graphs/code-frequency). É da opinião dos autores que se verifica o refinamento do código que outrora fora submetido.
