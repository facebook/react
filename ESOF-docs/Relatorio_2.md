# Relatório 2 - ESOF
## Facebook/React - Gestão de Requisitos

### <a name="levantamento"></a>Levantamento de Requisitos

Antes de se iniciar a discussão acerca da gestão de requisitos num projeto como o React, é necessário perceber claramente o contexto de desenvolvimento *open-source* em que o mesmo se enquadra. Os conceitos estudados nas aulas teóricas da Unidade Curricular de Engenharia de Software dizem respeito a projetos de *software* proprietário. Nesse sentido, esses conceitos aplicam-se apenas em parte a um projeto comunitário e sem fins lucrativos como é o React.

Na fase em que o projeto se encontra, os novos requisitos são determinados pela lista de *issues* levantados pela comunidade, assim como pelos *pull requests* que os colaboradores podem submeter para apreciação da *core team*, conforme discutido no [Relatório 1](./Relatorio_1.md). Não existe uma definição clara dos requisitos futuros, mas apenas um direcionamento e validação das sugestões supramencionadas com vista à sua integração na biblioteca, sem comprometer a estabilidade do projeto a longo prazo. Importa, no entanto, explorar a [motivação](http://reactjs.de/posts/react-tutorial) por parte do Facebook em desenvolver o React.

A principal motivação por trás do desenvolvimento da biblioteca React foi a vontade do Facebook em tornar o seu código *front-end*, isto é, o código que corre no lado do cliente, de uma compreensão e manutenção mais fáceis. Antes do aparecimento do React, visualizar o comportamento do código existente era um processo moroso. Certas partes do código eram tão complexas que apenas os membros de um dado grupo de colaboradores conseguiam tratá-las. Erros de sincronização eram muito frequentes, com perdas de mensagens na comunicação entre cliente e servidor.

O objetivo do React é, assim, possibilitar a escrita de código mais simples, definindo componentes que não estejam tão enredados e dependentes entre si, como acontecia anteriormente, diminuindo, assim, a complexidade de programação. Estes são, de uma forma geral, os requisitos não funcionais do React, que se assume como uma solução aos problemas encontrados no desenvolvimento de *single-page applications*.

#### *Single-Page Applications*

Uma [*single-page application*](https://en.wikipedia.org/wiki/Single-page_application) é uma aplicação Web que corre numa única página Web, conforme explicado no [Relatório 1](./Relatorio_1.md). O objetivo deste tipo de aplicação é fornecer uma experiência semelhante à de aplicações *desktop*, ou recebendo todo o código necessário à sua execução num único carregamento, ou carregando os recursos necessários de forma dinâmica, em resposta a ações do utilizador. A página não é recarregada durante o processo.

### <a name="analise"></a>Análise e Negociação

Como já foi mencionado na secção anterior, a principal fonte de requisitos provém quer dos vários colaboradores que apoiam o projecto quer da própria *core-team*. Uma das formas que um dado colaborador pode contribuir para o projecto é através da adição de *issues*, na secção apropriada, ou através de *pull requests*. Após submissão, a *core-team* fica encarregue de analisar as várias contribuições e determinar se são relevantes o suficiente para serem incorporadas no projecto. Note-se que o papel de análise por parte *core-team* está delineada no documento [Contributing to React](https://github.com/rppc/react/blob/master/CONTRIBUTING.md):

> [Pull Requests](https://github.com/facebook/react/blob/master/CONTRIBUTING.md#pull-requests): The core team will be monitoring for pull requests. (...)

> [Where to Find Known Issues](https://github.com/facebook/react/blob/master/CONTRIBUTING.md#where-to-find-known-issues): We will be using GitHub Issues for our public bugs. We will keep a close eye on this and try to make it clear when we have an internal fix in progress.

De notar que os *issues* e os *pull requests* podem expressar *bug reports*, isto é, correcções a serem realizadas no projecto por forma a colmatar os múltiplos erros que possam surgir no decorrer da utilização do React, ou *features requests*, ou seja, a descrição e, possivelmente, posterior implementação de determinadas características que levam ao melhoramento do projecto em geral. Contudo, no projecto, estas duas noções são tomadas como equivalentes. Assim sendo, neste relatório, os autores irão considerá-las também como equivalentes.

Note-se, contudo, que












A *core-team* utiliza o método de etiquetação das *issues*, por forma a atribuir diferentes significados/intenções aos *issues* e também para efeitos de organização.

Caso se constate que um *issue* possua uma relevante importância, é marcado como *good first bug* pela *core-team*, atribuíndo, desta forma, uma prioridade à resolução do *issue*. Deste modo, a *core-team* utiliza o método de etiquetação das *issues*, por forma a atribuir diferentes significados/intenções aos *issues* e também para efeitos de organização.

Como se pode constatar, todos os requisitos expostos pela comunidade são escrutinados pela *core-team* por forma a determinar quais possuem prioridade e que contribuem significativamente para o resultado final do projecto.

Negociação: através de comentários nos issues


### <a name="especificacao"></a>Especificação

Após a análise e negociação dos vários requisitos propostos, é necessário estabelecer o rumo que o projecto tomará nos próximos tempos. Assim, a *core-team* procede à realização de várias reuniões entre os seus elementos de tempos a tempos (assunto este que já foi abordado no relatório anterior). Nessas reuniões, tendo em conta os vários requisitos, são criados milestones.

https://discuss.reactjs.org/t/meeting-notes-2015-05-15/362


Reunião
|
v
Milestones



### <a name="validacao"></a>Validação de Requisitos


Este processo de validação de requisitos trata, tal como o nome indica , de validar quanto à consistência, precisão e contextualização dos requisitos levantados nos processos de [Levantamento de Requisitos](#levantamento) e [Análise e Negociação](#analise). É necessário demonstrar que os requisitos definem o sistema que o cliente realmente deseja.


Aplicando este processo ao React, como demonstra a figura abaixo relativa aos *pull request* recebidos no último mês, à data deste relatório, somos confrontados com 128 pedidos ativos, tendo 105 já aprovados e os restantes ainda em avaliação.


![Pull Requests no último mês do projeto React](./Resources/pull_requests_september-10_october-10.jpg)


Inicialmente, os *pull request* são testados, de forma a verificar se estão dentro dos requisitos exigidos, através da ferramenta **Travis IC** disponível no sítio [travis-ci.org](https://travis-ci.org/). Esta ferramenta, um serviço *hosted continuous integration* para projetos *open source* e privados, executa testes previamente preparados e informa a *core-team* do sucesso ou não dos testes. A resposta da ferramenta **Travis IC** não é decisiva, cabendo a decisão final à *core-team*, porque mesmo que reprove nos testes, o código pode ser adicionado ao projeto. Esta ferramenta é uma mais valia para os colaboradores devido à grande densidade de solicitações de alterações no projeto que recebem. 


O projeto *React* precisa também de validar o elevado número de *issues* que recebe, estando o último mês descriminado na seguinte imagem.


![Issues no último mês do projeto React](./Resources/issues_september-10_october-10.jpg)


~~Informação repetida na Analise, como por exemplo nas Issues.~~

#### <a name="objetivos"></a>Objetivos

Como o projeto depende de pessoas de forma independente, a comunicação entre elas pode muitas vezes não ocorrer. Com isso, pode acontecer que os colaboradores introduzam erros na correção dos issues e pôr em causa todo o projeto já realizado até à altura.
De modo a garantir que a evolução do projeto segue conforme as exigências do cliente, existe um grupo de pessoas que a sua função é verificar que as correções feitas foram o mais correto possível, realizando testes a essas alterações. Após esses testes, cabe a eles decidir se as correções aos *issues* são úteis ao projeto, indo de encontro às funcionalidades necessárias do programa final.

#### <a name="motivacao"></a>Motivação

O React é um caso pouco comum, porque normalmente os projetos *open source* nunca têm grande projeção e vão evoluindo consoante o gosto e a paciência dos seus criadores porque não passa de um passatempo para os contribuidores. Neste caso, o projeto têm um propósito importante, é uma biblioteca usada para criar interfaces gráficas incorporada no Facebook. Só isso é um grande estímulo para todos os que ajudam o projeto, podem ver que todo o seu contributo é aplicado na maior rede social da atualidade.

#### <a name="tecnicas"></a>Técnicas

Mesmo que os projectos *open source* não tenham, muitos deles, a dimensão e a estrutura de outros projetos realizados pelas grandes empresas, nada se consegue fazer sem organização. Para isso, existem os requesitos, são objetivos que os colaboradores têm de cumprir para se conseguir fazer evoluir o projeto.
No caso do React, qualquer um pode ajudar ao projecto. Para começar, uma boa base de trabalho são os good first bugs, tendo sido mesmo indicado por um dos responsáveis do projecto como sendo o melhor começo, e a partir daí passar para os issues que vão aparecendo.

### <a name="info"></a>Informações

##### Autores:

* António Casimiro (antonio.casimiro@fe.up.pt)
* Diogo Amaral (diogo.amaral@fe.up.pt)
* Pedro Silva (pedro.silva@fe.up.pt)
* Rui Cardoso (rui.peixoto@fe.up.pt)

Faculdade de Engenharia da Universidade do Porto - MIEIC

2015-10-18
