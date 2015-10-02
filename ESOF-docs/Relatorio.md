# Relatório ESOF
## Facebook/React

### Descrição do Projeto

React é uma biblioteca em JavaScript para a criação de interfaces gráficas para o utilizador.
Esta biblioteca é um dos primeiros projetos open source do Facebook que está em constante desenvolvimento e é usado para enviar código para todos no facebook.com. Os colaboradores continuam a trabalhar para tornar a contribuição para o projeto o mais fácil e transparente possivel.

### Processo de Desenvolvimento

O desenvolvimento da biblioteca React segue uma filosofia tipicamente Agile, constituindo-se como um processo focado na evolução contínua do software, com novas versões a ser lançadas, albergando novas funcionalidades, à medida que novos requisitos são determinados a partir do feedback dos utilizadores e da vontade dos próprios colaboradores do projeto.

No momento em que este relatório é redigido, o projeto encontra-se muito ativo, com uma média de 28,23 commits por semana, desde a semana com início a 5 de outubro de 2014 até à semana com início a 27 de setembro de 2015, e um total de mais de 5400 commits.

![Commits por semana do projeto React](./commits_graph.jpg)

Esta grande variedade de commits suporta a tese de que o projeto segue um processo Agile, com constantes adaptações e correções do código, adição de funcionalidades, evolução do sistema e refactoring.

Contudo, apesar da interpretação Na realidade, o projeto React não é um projeto único, mas antes uma coleção de [múltiplos projetos](https://github.com/facebook/react/wiki/Projects) interdependentes, cada um dos quais relacionado com um dado componente da biblioteca ou um conjunto de funcionalidades que necessitam de ser trabalhadas ou testadas. Uma vez que este facto poderia causar problemas de organização do repositório, um destes projetos, intitulado [Better Project Distinction](https://github.com/facebook/react/wiki/Projects#better-project-distinction), consiste precisamente organizar o projeto global da forma mais clara possível, distinguindo as funcionalidades dos vários projetos. Nas palavras de 

> With multiple interdependent projects in the same repo, we have a bit of a mess. I don’t think it hurts much to have these things together, but we should make this as clear as possible.

[Paul O'Shannessy](https://github.com/zpao), um dos principais colaboradores no desenvolvimento do React e responsável pela tarefa de distinção entre os projetos.



### Análise Crítica

A core team realiza reuniões, onde se discute os vários aspectos do projecto que podem ser melhorados, e planos futuros. A realização destas reuniões é feita, sensivelmente, de 2 em 2 semanas, cujos resultados são, posteriormente, colocados no fórum de discussão do React: https://discuss.reactjs.org/c/meeting-notes.

Numa primeira análise, verifica-se a importância da existência de um "janitor" no repositório por vários motivos. Um dos principais motivos é que este projecto sofre contribuições por parte de vários programadores, o que pode provocar um certa ordem de "caos". Deste modo, é imperativa a realização de várias "limpezas" por forma a garantir a consistência e organização do repositório.
