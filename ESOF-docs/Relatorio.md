# Relatório ESOF
## Facebook/React

### Descrição do Projeto

React é uma biblioteca em JavaScript para a criação de interfaces gráficas para o utilizador.
Esta biblioteca é um dos primeiros projetos open source do Facebook que está em constante desenvolvimento e é usado para enviar código para todos no facebook.com. Os colaboradores continuam a trabalhar para tornar a contribuição para o projeto o mais fácil e transparente possivel.

### Processo de Desenvolvimento

O desenvolvimento da biblioteca React segue uma filosofia tipicamente Agile, constituindo-se como um processo focado na evolução contínua do software, com novas versões a ser lançadas, albergando novas funcionalidades, à medida que novos requisitos são determinados a partir do feedback dos utilizadores e da vontade dos próprios colaboradores do projeto.

No momento em que este relatório é redigido, o projeto encontra-se muito ativo, com uma média de 28,23 commits por semana, desde a semana com início a 5 de outubro de 2014 até à semana com início a 27 de setembro de 2015, e um total de mais de 5400 commits.

![Commits por semana do projeto React](./commits_graph.jpg)

Esta grande variedade de commits suporta a tese de que o projeto segue uma metodologia Agile, com constantes adaptações e correções do código, adição de funcionalidades, evolução do sistema e refactoring. Contudo, apesar da interpretação dos autores deste relatório acerca da filosofia de base que rege o desenvolvimento da biblioteca React, não parece haver um único processo de desenvolvimento bem definido, mas antes um conjunto de práticas associadas a processos Agile, como Scrum e XP, seguidas pelos colaboradores do projeto.

Na realidade, o projeto React não é um projeto único, mas antes uma coleção de [múltiplos projetos](https://github.com/facebook/react/wiki/Projects) interdependentes, cada um dos quais relacionado com um dado componente da biblioteca ou um conjunto de funcionalidades que necessitam de ser trabalhadas ou testadas. Uma vez que este facto poderia causar problemas de organização do repositório, um destes projetos, intitulado [Better Project Distinction](https://github.com/facebook/react/wiki/Projects#better-project-distinction), consiste precisamente organizar o projeto global da forma mais clara possível, distinguindo as funcionalidades dos vários projetos.

> With multiple interdependent projects in the same repo, we have a bit of a mess. I don’t think it hurts much to have these things together, but we should make this as clear as possible.

Estas palavras pertencem [Paul O'Shannessy](https://github.com/zpao), um dos principais colaboradores no desenvolvimento do React e responsável pela tarefa de distinção entre os projetos. Apesar de, aparentemente, existir a possibilidade de os colaboradores do projeto se depararem com algumas dificuldades na orientação do seu trabalho, a equipa central do projeto, designada de *core team*, realiza [reuniões frequentes](https://discuss.reactjs.org/c/meeting-notes), espaçadas de uma a duas semanas, onde são definidos os objetivos para o período entre uma reunião e a reunião seguinte, seguindo um conceito semelhante ao de um *sprint* no processo *Scrum*.

O conjunto de objetivos que são definidos nestas reuniões podem 

### Análise Crítica

O projecto em estudo pelos autores deste relatório sofre múltiplas contribuições por parte de vários programadores, provenientes da core team ou qualquer pessoa que deseje adicionar a sua contribuição ao projecto. Como cada contribuidor possui o seu próprio método de organização e de programação, e sendo este um projecto constiruído por vários deles, é essencial o establecimento de determinados padrões, por forma a garantir a organização e o sucesso deste projecto.

Uma das formas que os principais contribuidores do projecto (core team) usam para garantir um processo de desenvolvimento fluído e eficaz é descriminando as várias convenções utilizadas ao longo do código e como deve ser utilizado o repositório.

Todavia, apesar do estabelecimento das regras supramencionadas, podem surgir vários problemas de organização ao nível do repositório, que, em última análise, deterioram o processo de desenvolvimento. Deste modo, verifica-se a importância da existência de um "janitor" que garanta que os vários aspectos de organização são cumpridos e, se não, corrigi-los. 



