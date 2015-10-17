# Relatório 2 - ESOF
## Facebook/React - Gestão de Requisitos

### <a name="levantamento"></a>Levantamento de Requisitos

Antes de se iniciar a discussão acerca da gestão de requisitos num projeto como o React, é necessário perceber claramente o contexto de desenvolvimento *open-source* em que o mesmo se enquadra. Os conceitos estudados nas aulas teóricas da Unidade Curricular de Engenharia de Software estão ligeiramente mais adaptados a projetos de *software* proprietário e, nesse sentido, aplicam-se apenas em parte a um projeto comunitário e sem fins lucrativos como é o React.

Na fase em que o projeto se encontra, os novos requisitos são determinados pela lista de *issues* levantados pela comunidade, assim como pelos *pull requests* que os colaboradores podem submeter para apreciação da *core team*, conforme discutido no [Relatório 1](./Relatorio_1.md). Não existe uma definição clara dos requisitos futuros, mas apenas um direcionamento e validação das sugestões supramencionadas com vista à sua integração na biblioteca, sem comprometer a estabilidade do projeto a longo prazo. Importa, no entanto, explorar a motivação por parte do Facebook em desenvolver o React, descrevendo, em seguida, os seus casos de uso típicos e apresentando alguns requisitos próprios do React que o diferenciam de outras bibliotecas de JavaScript, nomeadamente a criação de *single-page applications* e isomorfismo.

#### Motivação

A principal [motivação](http://reactjs.de/posts/react-tutorial) por trás do desenvolvimento da biblioteca React foi a vontade do Facebook em tornar o seu código *front-end*, isto é, o código que corre no lado do cliente, de uma compreensão e manutenção mais fáceis. Antes do aparecimento do React, visualizar o comportamento do código existente era um processo moroso. Certas partes do código eram tão complexas que apenas os membros de um dado grupo de colaboradores conseguiam tratá-las. Erros de sincronização eram muito frequentes, com perdas de mensagens na comunicação entre cliente e servidor.

O objetivo do React é, assim, possibilitar a escrita de código mais simples, definindo componentes que não estejam tão enredados e dependentes entre si, como acontecia anteriormente, diminuindo, assim, a complexidade de programação. Estes são, de uma forma geral, os requisitos não funcionais do React.

#### Casos de Uso

O diagrama seguinte mostra os casos de uso típicos do React, descrevendo, de forma geral, os requisitos funcionais desta biblioteca.

![Casos de uso típicos do React](./Resources/Primary\ Use\ Cases.jpg)

O React é usado por sistemas que integram interfaces gráficas para o utilizador. Estes sistemas fazem, portanto, parte do grupo de [*stakeholders*](https://en.wikipedia.org/wiki/Project_stakeholder) do projeto. Os mesmos devem poder incluir a biblioteca com o objetivo principal de criar uma Vista para interação com o utiizador. A criação de uma Vista envolve a criação de [elementos](https://facebook.github.io/react/docs/component-api.html) da mesma, os quais podem ser *tags* de HTML ou de tipos (classes) definidos pelo programador. Uma classe pode ser definida estendendo a classe [React.Component](https://facebook.github.io/react/docs/component-api.html), usando a [sintaxe ES6](https://facebook.github.io/react/docs/reusable-components.html#es6-classes), ou recorrendo ao *wrapper* especial [React.createClass](https://facebook.github.io/react/docs/top-level-api.html#react.createclass). É, ainda, possível realizar a [validação dos tipos de dados](https://facebook.github.io/react/docs/reusable-components.html#prop-validation) que cada elemento recebe durante a execução da aplicação.

Ao criar elementos representados por *tags* de HTML, isto é, componentes do *Document Object Model* (DOM), podem ser usados *wrappers* especiais definidos pela classe [React.DOM](https://facebook.github.io/react/docs/top-level-api.html#react.dom). Esta funcionalidade do React é de particular relevância, pois a sua definição constitui um dos princípios fundamentais desta biblioteca, contribuindo para uma maior facilidade no desenvolvimento das chamadas *single-page applications*.

#### *Single-Page Applications*

Uma [*single-page application*](https://en.wikipedia.org/wiki/Single-page_application) é uma aplicação Web que corre numa única página, conforme referido no [Relatório 1](./Relatorio_1.md#descricao). A biblioteca React confere maior facilidade no desenvolvimento deste tipo de aplicações, cujo objetivo é fornecer uma experiência semelhante à de aplicações *desktop*, ou recebendo todo o código necessário à sua execução num único carregamento, ou carregando os recursos de forma dinâmica, em resposta a ações do utilizador. A página não é recarregada durante todo o processo. A interação com uma aplicação deste tipo envolve comunicação dinâmica com o servidor Web.

#### Isomorfismo (*Server-Side Rendering*)

Outro requisito do React é permitir o [*rendering* da aplicação no lado do servidor](https://www.terlici.com/2015/03/18/fast-react-loading-server-rendering.html), um conceito conhecido como isomorfismo. Em vez de enviar uma grande quantidade de código JavaScript para a aplicação cliente, o próprio servidor tem a capacidade de realizar o [*rendering* da árvore DOM](http://www.pathinteractive.com/blog/design-development/rendering-a-webpage-with-google-webmaster-tools/) da página, enviando apenas código HTML. No lado do cliente, apenas é necessário juntar os *event handlers* necessários, o que torna o carregamento inicial da página mais rápido. Para que o resultado destas operações seja uma página dinâmica e com bom tempo de resposta, é necessário que a árvore DOM seja atualizada nos momentos certos. O React implementa algoritmos muito eficientes que permitem que a aplicação realize alterações à árvore DOM da página num número mínimo de passos, recorrendo a [heurísticas](http://facebook.github.io/react/docs/reconciliation.html) que, não garantindo uma solução ótima, garantem soluções muito rápidas para quase todos os casos de uso.

### <a name="analise"></a>Análise e Negociação

Como já foi mencionado na secção anterior, a principal fonte de requisitos correntes provém das listas de *issues* e de *pull requests* existente no repositório do GitHub. A primeira é povoada pela contribuição quer da própria *core-team*, quer dos elementos externos a ela. Qualquer colaborador pode sugerir alterações a certas partes do projecto, por exemplo, reportando *bugs*, ou solicitando novas *features*, como será explicado posteriormente. Pode, igualmente, solicitar a integração de alterações feitas ao código-fonte da biblioteca através de um *pull request*. 

Perante um conjunto tão diverso de fontes de requisitos, é necessário prodecer a uma análise prévia dos pedidos submetidos, garantindo que não há conflitos entre as várias propostas ou no código (impedindo, por exemplo, a existência de código redundante). Desta forma, a *core-team* reserva-se o direito de analisar as várias contribuições e determinar se são suficientemente relevantes e pertinentes para serem integradas no projecto. Note-se, contudo, que, mesmo após realizada a análise e se verificar que a contribuição é significante para o projecto, é necessário proceder à execução de testes sobre o código submetido. Este assunto será abordado na secção [Validação](#validacao).

Por forma a tornar claro o papel da *core team* neste processo, o documento [Contributing to React](https://github.com/facebook/react/blob/master/CONTRIBUTING.md) define, entre outros assuntos, que o processo de análise fica ao cargo dessa equipa.

> [Pull Requests](https://github.com/facebook/react/blob/master/CONTRIBUTING.md#pull-requests): The core team will be monitoring for pull requests. (...)

> [Where to Find Known Issues](https://github.com/facebook/react/blob/master/CONTRIBUTING.md#where-to-find-known-issues): We will be using GitHub Issues for our public bugs. We will keep a close eye on this and try to make it clear when we have an internal fix in progress.

É essencial a implementação de um sistema de organização dos *issues* e dos *pull requests*. Para tal, são usados os sistemas de etiquetas e de *milestones*, disponibilizados pelo GitHub, de forma a classificar os vários requisitos. Deste modo, estabelecem-se prioridades que permitem delinear, com maior clareza, o rumo que o projecto deverá seguir. Estas prioridades são definidas pela *core-team*, que se organiza em reuniões entre os seus elementos, traçando, a médio prazo, a orientação do projecto, como será descrito adiante.

Note-se, contudo, que nem todos os requisitos propostos podem ser considerados viáveis. Nestas situações, ou o pedido é rejeitado, ou é negociado e adaptado às necessidades do projeto. Para este efeito, os colaboradores recorrem à secção de discussão associada a cada *issue* e a cada *pull request* como um meio para eventuais esclarecimentos. Tome-se o caso do [issue #5179](https://github.com/facebook/react/pull/5179) como exemplo. Um dado colaborador procedeu a modificações na sintaxe de importação da biblioteca. Todavia, esta mudança foi rejeitada sob o pretexto de que dificultaria a utilização do React, ao acrescentar novas dependências.

### <a name="especificacao"></a>Especificação

Após a análise e eventual negociação dos vários requisitos, é necessário estabelecer o rumo que o projecto deverá tomar a médio prazo. Numa abordagem mais estruturada, esta seria a fase em que se procederia à elaboração de um documento formal de especificação de requisitos. Todavia, no contexto de um projeto como o do React, no qual há uma grande diversidade de novos requisitos, em constante mudança, um documento deste género pode não existir. Efetivamente, os autores deste relatório não encontraram qualquer evidência da existência de um documento de especificação de requisitos associado a este projeto, tendo, contudo, constatado que algumas alternativas razoavelmente formais são seguidas.

O aspeto de maior relevância no que diz respeito à especificação de requisitos é a realização de reuniões regulares entre os elementos da *core team*, tal como já foi discutido no [Relatório 1](./Relatorio_1.md#processo). Estas reuniões são aproveitadas para definir o rumo que o projeto deverá seguir, sendo que essas orientações podem ser modificadas em reuniões subsequentes.

Entre outros temas, as reuniões abordam a definição dos *milestones* - que, como já foi referido no [Relatório 1](./Relatorio_1.md#processo), correspondem a versões da biblioteca React -, como se pode constatar nas notas da [Reunião de 2015-05-15](https://discuss.reactjs.org/t/meeting-notes-2015-05-15/362), cuja agenda previa o planeamento das versões [0.14](https://github.com/facebook/react/issues?q=milestone%3A0.14) e [0.15](https://github.com/facebook/react/milestones/0.15). Note-se que um *milestone* é utilizado para agrupar *issues* e *pull requests* que estejam, de certa forma, relacionados entre si, constituindo-se, na prática, como um conjunto de requisitos funcionais para uma dada versão da biblioteca. No caso do React, é possível perceber o quão próximo está o projecto de atingir os objetivos que foram delineados para cada *milestone* através da percentagem de *issues* e de *pull requests* já endereçados pela comunidade, como se constata na secção de [*milestones*](https://github.com/facebook/react/milestones) do projeto.

No entender dos autores deste relatório, o momento mais formal do processo de especificação de requisitos da biblioteca React consiste, provavelmente, na definição da sua [API pública](http://facebook.github.io/react/docs/top-level-api.html), documento onde são descritos, embora de uma forma não tão formal como é hábito noutros projetos, as funcionalidades que a biblioteca deve implementar.

### <a name="validacao"></a>Validação de Requisitos

Este processo de validação de requisitos trata, tal como o nome indica, de validar quanto à consistência, precisão e contextualização dos requisitos levantados nos processos de [Levantamento de Requisitos](#levantamento) e [Análise e Negociação](#analise). É necessário demonstrar que os requisitos definem o sistema que o cliente realmente deseja.

Aplicando este processo ao **React**, não existe o conceito de clientes que devem validar os requisitos, pelo contrário, a *core team* do projeto é a responsável pela validação, sendo eles, a um certo nível, os *stakeholders*. 

Ao nível da validação para o **React** podemos considerar as *issues* e os *pull requests*.

Como demonstra a figura abaixo relativa aos *pull request* recebidos no último mês, à data deste relatório, somos confrontados com 128 pedidos ativos, tendo 105 já aprovados e os restantes ainda em avaliação.

![Pull Requests no último mês do projeto React](./Resources/pull_requests_september-10_october-10.jpg)

Inicialmente, os *pull request* são testados automaticamente, de forma a verificar se estão dentro dos requisitos exigidos, através da ferramenta **Travis IC** disponível no sítio [travis-ci.org](https://travis-ci.org/). Esta ferramenta, um serviço *hosted continuous integration* para projetos *open-source* e privados, executa testes de compilação e regista o sucesso ou não dos testes. A resposta da ferramenta **Travis IC** não é decisiva quanto à aceitação do *source code*, cabendo a decisão final à *core team*, porque mesmo que reprove nos testes, o *pull request* pode ser adicionado ao projeto. Esta ferramenta é uma mais-valia para os colaboradores devido à grande densidade de solicitações de alterações que o projeto recebe. 

O projeto **React** precisa também de validar o elevado número de *issues* que recebe, estando o último mês descriminado na seguinte imagem.

![Issues no último mês do projeto React](./Resources/issues_september-10_october-10.jpg)

A *core team* utiliza o método de etiquetação das *issues*, por forma a atribuir diferentes significados/intenções aos *issues* e também para efeitos de organização. Por exemplo, caso se constate que um *issue* possui uma ideia interessante, é marcado como *good first bug* pela *core team*, atribuindo, desta forma, uma prioridade à resolução do *issue*.

É de realçar a importância que a *core team* dá para a organização do código. São mais de cinco centenas de colaboradores e cinco milhares de *commits*, à presente data deste relatório, que tornam a sua gestão custosa. E, caso se consiga corrigir erros previamente, evitar-se-á elevados custos no futuro devido à elevada dimensão do projeto, como referido.

Como se pode constatar, todos os requisitos expostos pela comunidade são escrutinados pela *core-team* por forma a determinar quais possuem prioridade e que contribuem significativamente para o resultado final do projeto.

#### <a name="tecnicas"></a>Técnicas

O processo de [Validação](#validacao) utiliza técnicas padronizadas de forma a esmiuçar o máximo possível o plano recebido de forma a aceita-lo ou retornar uma lista com os problemas que devem ser resolvidos.

* Revisão de requisitos: realização de uma análise aos requisitos nas reuniões realizadas pela *core team*, identificando individualmente problemas que deverão ser corrigidos.

* Prototipagem: utilização de uma interface para avaliar de uma forma visual o *source code* que se pretende implementar.

* Validação de modelos: validação individual dos novos modelos pela *core team*.

* Geração de casos de teste: desenvolvimento de testes específicos para a validação como a análise de consistência automática do *source code* através da ferramenta **Travis IC**.

### <a name="conc"></a>Conclusões

Este projeto apresenta um conceito de validação de recursos oposto ao esperado e estudado. Neste caso, não é a *core team* que procura os colaboradores e diz que *features* gostavam que fossem implementadas. São os colaboradores que desenvolvem as funcionalidades que acham que melhorariam o projeto e, só depois, fazem *pull request*. Após este passo, estas novas alterações são analisadas pelos responsáveis do projeto e caso sejam melhorias úteis para o projeto final, são introduzidas no repositório principal.

### <a name="info"></a>Informações

##### Autores:

* António Casimiro (antonio.casimiro@fe.up.pt)
* Diogo Amaral (diogo.amaral@fe.up.pt)
* Pedro Silva (pedro.silva@fe.up.pt)
* Rui Cardoso (rui.peixoto@fe.up.pt)

Faculdade de Engenharia da Universidade do Porto - MIEIC

2015-10-18
