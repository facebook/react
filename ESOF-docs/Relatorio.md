# Relatório ESOF
## Facebook/React

### <a name="descricao"></a>Descrição do Projeto

React é uma biblioteca *open-source* de JavaScript para a criação de interfaces para o utilizador desenvolvida pelo Facebook, Instagram e por uma comunidade de colaboradores.

A maior parte da comunidade que utiliza e/ou desenvolve a biblioteca React considera que a mesma constitui apenas a componente *view* no padrão de arquitetura de *software* *Model-View-Controller*, ou MVC, isto é, a representação da informação conforme mostrada ao utilizador.

O projeto mantém um DOM (*Document Object Model*) virtual, abstraindo o DOM do *browser*, para a representação e interação com objetos em documentos HTML, XHTML e XML. Isto permite que atualizações à página Web e ao DOM do *browser* possam ocorrer de forma mais eficiente e transparente, oferecendo um modelo de programação mais simples e um melhor desempenho. Efetivamente, o objetivo principal do React é facilitar o desenvolvimento das chamadas *single-page applications*, isto é, aplicações Web que, não obstante sofrerem alterações ao longo do tempo, correm numa única página, de forma semelhante a uma aplicação *desktop*, recebendo todo o código necessário à sua execução (HTML, JavaScript e CSS) num único carregamento.

O React pode correr no lado do servidor usando a biblioteca Node.js, num conceito conhecido como *JavaScript Isomorphism*, particularmente relevante para páginas Web com elevado volume de tráfego. Através da *framework* React Native, pode ainda ser usado no desenvolvimento de aplicações nativas para Android e iOS.

Esta biblioteca é um dos primeiros projetos *open-source* do Facebook, encontrando-se em constante desenvolvimento. Os colaboradores trabalham para tornar a contribuição para o projeto o mais fácil e transparente possível.

Um grande número de [páginas e aplicações](https://github.com/facebook/react/wiki/Sites-Using-React) usam o React, sendo o Facebook, o Instagram, o Netflix e a Yahoo os nomes mais sonantes.

A versão estável mais recente desta biblioteca é a [0.13.3](https://github.com/facebook/react/issues?q=milestone%3A0.13.3).

### <a name="processo"></a>Processo de Desenvolvimento

Embora não tendo um processo bem determinado, o desenvolvimento da biblioteca React segue alguns princípios Agile, constituindo-se como um processo focado na evolução contínua do *software*, com novas versões a ser lançadas, albergando novas funcionalidades, à medida que novos requisitos são determinados a partir do *feedback* dos utilizadores, programadores que fazem uso da biblioteca, e da vontade dos próprios colaboradores do projeto.

No momento em que este relatório é redigido, o projeto encontra-se muito ativo, com uma média de 28,23 *commits* por semana, desde a semana com início a 5 de outubro de 2014 até à semana com início a 27 de setembro de 2015, e um total de mais de 5400 *commits*.

![Commits por semana do projeto React](./commits_graph.jpg)

Esta grande variedade de *commits* é exemplificativa dos princípios Agile seguidos pelos desenvolvedores do projeto, com constantes adaptações e correções do código, adição de funcionalidades, evolução do sistema e *refactoring*. Como já foi referido, não parece haver um único processo de desenvolvimento bem definido, mas antes um conjunto de práticas que pode ser comparado a processos como *Scrum* e XP e que é seguido pelos colaboradores do projeto, ainda que de forma não particularmente sistematizada, como refere [Ben Alpert](https://github.com/spicyj), um dos principais colaboradores do projeto.

> We don't have any particular "methodologies" that we follow. I'm not personally familiar with what Agile involves, but I don't think any of us see particular value in trying to build a lot more structure into any of our processes right now.

A frase surge na sequência de uma discussão iniciada pelos autores deste relatório no fórum [React Discuss](https://discuss.reactjs.org/t/react-development-process/2135).

Na realidade, o projeto React não é um projeto único, mas antes uma coleção de [múltiplos projetos](https://github.com/facebook/react/wiki/Projects) interdependentes, cada um dos quais relacionado com um dado componente da biblioteca ou um conjunto de funcionalidades que necessitam de ser trabalhadas ou testadas. Uma vez que este facto pode causar potenciais problemas de organização do repositório, um destes projetos, intitulado [Better Project Distinction](https://github.com/facebook/react/wiki/Projects#better-project-distinction), consiste precisamente em estruturar o projeto global da forma mais clara possível, distinguindo as funcionalidades dos vários subprojetos.

> With multiple interdependent projects in the same repo, we have a bit of a mess. I don’t think it hurts much to have these things together, but we should make this as clear as possible.

Estas palavras pertencem a [Paul O'Shannessy](https://github.com/zpao), um dos principais colaboradores no desenvolvimento do React e responsável pela tarefa de distinção entre os projetos e revisão dos mesmos. Estas tarefas de revisão de código aparentam ser inspiradas pelo processo de desenvolvimento XP (*Extreme Programming*), nos quais a prática é frequente. Apesar de, aparentemente, existir a possibilidade de os colaboradores do projeto se depararem com algumas dificuldades na orientação do seu trabalho, a equipa central do projeto, designada de *core team*, realiza [reuniões frequentes](https://discuss.reactjs.org/c/meeting-notes), espaçadas de uma a duas semanas, onde são definidos os objetivos para o período entre uma reunião e a reunião seguinte, seguindo um conceito semelhante ao de um *sprint* no processo *Scrum*.

O conjunto de objetivos que são definidos nestas reuniões podem ser sugeridos pelos elementos da *core team* ou escolhidos a partir de uma [lista de *issues*](https://github.com/facebook/react/issues). Esta lista é alimentada por colaboradores do projeto ou por utilizadores da biblioteca e cada item pode dizer respeito a uma funcionalidade que o seu autor deseja ver incluída no projeto ou a um *bug* encontrado. Cada *issue* pode ter associada uma categoria do projeto (e.g., *Component Addons / TestUtils*), ou ser assinalado como *good first bug*, se assinalar um dado problema pela primeira vez. Um *issue* também pode ser rejeitado pela comunidade.

O projeto também define várias [*milestones*](https://github.com/facebook/react/milestones), isto é, um conjunto maior de objetivos e funcionalidades a atingir a médio-longo prazo. Na prática, cada *milestone* corresponde a uma versão da biblioteca React. No momento em que este relatório é redigido, a versão mais recente da biblioteca é a versão [0.13.3](https://github.com/facebook/react/issues?q=milestone%3A0.13.3), encontrando-se a versão [0.14](https://github.com/facebook/react/milestones/0.14) em desenvolvimento e a versão [0.15](https://github.com/facebook/react/milestones/0.15) já com alguns *issues* em aberto. Este trabalho de constante refinamento e evolução do projeto, já com treze versões lançadas desde o seu início, em 2013, é mais uma evidência das metodologias comparáveis à de processos Agile seguidas pelos desenvolvedores da biblioteca. Um *milestone* é constituído por um conjunto de *issues* que dizem respeito ao aperfeiçoamento e adição de funcionalidades e à correção de *bugs*.

O projeto tem um conjunto de proprietários, a *core team*, e um grupo de mais de 500 colaboradores fixos, no momento em que este relatório é redigido. No entanto, qualquer membro da comunidade GitHub pode contribuir para o [projeto](https://github.com/facebook/react), devendo, para o efeito, realizar um *fork* do [repositório](https://github.com/facebook/react) correspondente e, após realizar alterações com alguma significância, solicitar aos proprietários que as incorporem no *branch* principal, através de um *pull request*. As alterações apenas serão aceites se o código passar alguns testes realizados por elementos da *core team*. As [instruções para contribuição](https://github.com/facebook/react/blob/master/CONTRIBUTING.md) para o projeto estão bem definidas. Os colaboradores deverão respeitar um [código de conduta](https://code.facebook.com/pages/876921332402685/open-source-code-of-conduct) redigido pelo Facebook, com vista à harmonia entre todos os participantes, que deverão ainda aceitar um acordo designado de [*Contributor Licence Agreement* (CLA)](https://github.com/facebook/react/blob/master/CONTRIBUTING.md#contributor-license-agreement-cla).

### <a name="analise"></a>Análise Crítica

Este projecto pode ser analisado à luz de várias perspetivas. Neste relatório, serão focados os seguintes pontos:

* Commits
  * Frequência
  * Qualidade / Pertinência
* Organização
  * Código
  * Repositório
* *Milestones*
  * Relação com as versões finais e *issues*
* Reuniões
  * Pertinência
  * Frequência
* Conclusões

#### Commits
##### Frequência

Tal como referido na secção [Processo de Desenvolvimento](#processo), o projeto encontra-se muito ativo no momento em que este relatório é redigido. O elevado número médio de *commits* por semana (28,23) torna claro que o projeto se encontra ainda longe do fim do seu ciclo de vida, com novas funcionalidades a serem introduzidas de forma muito frequente e *bugs* a serem corrigidos quase diariamente. A frequência dos *commits* parece-nos normal para um projeto desta dimensão e que ainda apresenta uma grande margem de evolução, continuando a despertar o interesse de colaboradores, utilizadores e várias [organizações](https://github.com/facebook/react/wiki/Sites-Using-React).

##### Qualidade / Pertinência

Os *commits* são normalmente acompanhados por uma mensagem que quase sempre nos parece pertinente, concisa e perfeitamente explicativa da alteração que foi realizada. Nesta fase do projeto, a maior parte dos *commits* diz respeito a correções de erros. Embora não seja possível averiguar, ao certo, se todos os *commits* foram realmente úteis para o projeto, uma vez que são muito raros aqueles que recebem comentários de outros colaboradores, parece-nos razoável admitir que a grande maioria foi de alguma pertinência e contribuiu para um aumento global da qualidade do projeto. Contudo, verifica-se que, quando o projecto sofre adições de código, ocorrem, praticamente em simultâneo, eliminações, como se constata através da [estatística disponibilizada pelo GitHub](https://github.com/facebook/react/graphs/code-frequency). É da opinião dos autores que essas eliminações correspondem a um refinamento do código, com vista a uma melhor incorporação das funcionalidades acrescentadas e à consistência do projeto.

#### Organização
##### Código

Analisando os vários documentos de código, constata-se que os mesmos estão bem comentados, sendo explicitadas algumas considerações tomadas pelos colaboradores no desenvolvimento das várias funcionalidades. A API encontra-se bem documentada e os ficheiros de código encontram-se distribuídos em pacotes lógicos, o que nos parece muito apropriado para um projeto desta dimensão.


##### Repositório

Sendo este um projecto aberto à comunidade, e, por conseguinte, sujeito a múltiplas contribuições por parte de vários desenvolvedores de *software*, é imperativo o estabelecimento de padrões de organização, por forma a garantir o sucesso do projecto. Desta forma, os membros da *core team* discriminam as múltiplas convenções utilizadas, quer ao longo do código, quer no repositório. Para além do cumprimento destas regras, um desenvolvedor pode solicitar *pull requests* à *core team* de forma a que a sua contribuição seja incorporada no ramo principal. Do ponto de vista dos autores, esta componente é essencial para permitir um processo de desenvolvimento fluído e eficaz, garantindo, ao mesmo tempo, que a evolução do projecto não é comprometida.

Todavia, apesar do estabelecimento das regras supramencionadas, podem surgir vários problemas de organização ao nível do repositório, que, em última análise, constituem um potencial risco para o processo de desenvolvimento. Deste modo, destaca-se a importância de um colaborador que garanta que os vários aspectos de organização são cumpridos, procedendo a correções sempre que necessário. No caso do React, esse colaborador é [Paul O'Shannessy](https://github.com/zpao).

Não é, de todo, descabido pensar-se que os vários subprojetos que constituem o React deveriam estar distribuídos por repositórios diferentes. No entanto, uma vez que existe uma forte interdependência entre os mesmos, parece-nos que o modelo seguido é apropriado, desde que a organização do repositório não seja comprometida.

#### *Milestones*
##### Relação com as versões finais e *issues*

Tal como foi referido na secção anterior, cada *milestone* do projeto corresponde a uma dada versão da biblioteca e é composto por um conjunto de *issues* que a comunidade deverá endereçar. Esta abordagem parece-nos intuitiva, tratando cada versão da biblioteca como um conjunto de objetivos a atingir a médio-longo prazo, incorporando novas funcionalidades que se manterão em versões seguintes. O facto de um *milestone* ser composto por uma lista de *issues* beneficia a participação de toda a comunidade React, colaboradores e utilizadores da biblioteca, no estabelecimento dos requisitos para novas versões da biblioteca, o que nos parece bastante positivo.

#### Reuniões
##### Pertinência

A realização de [reuniões](https://discuss.reactjs.org/c/meeting-notes) entre os elementos da *core team* para o estabelecimento de objetivos a médio prazo parece-nos particularmente pertinente e adequada, dada a natureza colaborativa do projeto. Nestas reuniões, são discutidos vários aspetos relacionados com o desenvolvimento da biblioteca, nomeadamente novas funcionalidades e erros que requeiram maior atenção do que um *bug* comum. A existência destas discussões parece-nos essencial para a correta condução do projeto, uma vez que, seguindo o mesmo a filosofia *open-source*, se poderia verificar a sua deterioração.

##### Frequência

As reuniões são normalmente espaçadas por períodos de cerca de uma a duas semanas, embora esse período possa ser estendido indefinidamente. A frequência das reuniões não é tão elevada como o que acontece, por exemplo, no modelo de processo *Scrum*, pelo que poderemos ser levados a pensar que não existe um grande esforço por parte da *core team* em perceber se os objetivos definidos em cada reunião estão a ser aplicados. No entanto, esta conclusão poderá não ser a mais correta, uma vez que as ferramentas de desenvolvimento e de comunicação atualmente existentes possibilitam a monitorização do desenvolvimento de um processo sem a necessidade de reuniões quase diárias.