# Relatório 2 - ESOF
## Facebook/React - Gestão de Requisitos

### <a name="levantamento"></a>Levantamento de Requisitos

Antes de se iniciar a discussão acerca da gestão de requisitos num projeto como o React, é necessário perceber claramente o contexto de desenvolvimento *open-source* em que o mesmo se enquadra. Os conceitos estudados nas aulas teóricas da Unidade Curricular de Engenharia de Software dizem respeito a projetos de *software* proprietário. Nesse sentido, esses conceitos aplicam-se apenas em parte a um projeto comunitário e sem fins lucrativos como é o React.

Na fase em que o projeto se encontra, os novos requisitos são determinados pela lista de *issues* levantados pela comunidade, assim como pelos *pull requests* que os colaboradores podem submeter para apreciação da *core team*, conforme discutido no [Relatório 1](./Relatorio_1.md). Não existe uma definição clara dos requisitos futuros, mas apenas um direcionamento e validação das sugestões supramencionadas com vista à sua integração na biblioteca, sem comprometer a estabilidade do projeto a longo prazo. Importa, no entanto, explorar a [motivação](http://reactjs.de/posts/react-tutorial) por parte do Facebook em desenvolver o React.

A principal motivação por trás do desenvolvimento da biblioteca React foi a vontade do Facebook em tornar o seu código *front-end*, isto é, o código que corre no lado do cliente, de uma compreensão e manutenção mais fáceis. Antes do aparecimento do React, visualizar o comportamento do código existente era um processo moroso. Certas partes do código eram tão complexas que apenas os membros de um dado grupo de colaboradores conseguiam tratá-las. Erros de sincronização eram muito frequentes, com perdas de mensagens na comunicação entre cliente e servidor.

O objetivo do React é, assim, possibilitar a escrita de código mais simples, definindo componentes que não estejam tão enredados e dependentes entre si, como acontecia anteriormente, diminuindo, assim, a complexidade de programação. Estes são, de uma forma geral, os requisitos não funcionais do React, que se assume como uma solução aos problemas encontrados no desenvolvimento de *single-page applications*.

#### *Single-Page Applications*

### <a name="analise"></a>Análise e Negociação

Uma das formas que um dado colaborador pode contribuir para o projecto é através da adição de *issues*, na secção apropriada, ou através de *pull requests*, onde a *core-team* pode, após uma cuidada análise, por forma a determinar se são significativos para a contribuição do projeto, incorporar tais modificações, intenção manifestada no documento [Contributing to React](https://github.com/rppc/react/blob/master/CONTRIBUTING.md):

> [Pull Requests](https://github.com/facebook/react/blob/master/CONTRIBUTING.md#pull-requests): The core team will be monitoring for pull requests. (...)
> [Where to Find Known Issues](https://github.com/facebook/react/blob/master/CONTRIBUTING.md#where-to-find-known-issues): We will be using GitHub Issues for our public bugs. We will keep a close eye on this and try to make it clear when we have an internal fix in progress.

De notar que os *issues* e os *pull requests* podem expressar *bug reports*, isto é, correcções a serem realizadas no projecto por forma a colmatar os múltiplos erros que possam surgir no decorrer da utilização do React, ou *features requests*, ou seja, a descrição e posterior implementação de determinadas características que levam ao melhoramento do projecto em geral. Contudo, no projecto, estas duas noções são tomadas como equivalentes. Assim sendo, neste relatório, os autores deste relatório irão considerar também como equivalentes.


Caso se constate que um *bug report* possui uma relevante importância, é marcado como *good first bug* pela *core-team*, atribuíndo, desta forma, uma prioridade à resolução do *bug*. Na situação de se tratar de uma *feature request*, são incorporados nos [*milestones*](https://github.com/facebook/react/milestones) delineados pela *core-team*.

Note-se que, por forma a organizar a lista de *issues*, são utilizadas várias *labels* por forma a atribuir diferentes significados/intenções.

### Especificação


### <a name="validacao"></a>Validação de Requisitos


Este processo de validação de requisitos trata, tal como o nome indica , de validar quanto à consistência, precisão e contextualização dos requisitos levantados no processo de [Levantamento de Requisitos](#levantamento) e [Análise e Negociação](#analise).
Cada colaborador escolhe, da lista de *issues* ou *good first bugs*, aquele ou aqueles que se vai atrever a resolver. Antes de fazer *pull request*, a correção deve ser testada para ter a certeza que o problema ficou resolvido.
Mesmo depois de enviar a correção, cabe aos verificadores certificar-se que as correções ao código foram realmente bem feitas, que não vão introduzir novos erros e que aquela especificação ainda é útil para o projecto.

#### Objetivos

Como o projeto depende de pessoas de forma independente, a comunicação entre elas pode muitas vezes não ocorrer. Com isso, pode acontecer que os colaboradores introduzam erros na correção dos issues e pôr em causa todo o projeto já realizado até à altura.
De modo a garantir que a evolução do projeto segue conforme as exigências do cliente, existe um grupo de pessoas que a sua função é verificar que as correções feitas foram o mais correto possível, realizando testes a essas alterações. Após esses testes, cabe a eles decidir se as correções aos *issues* são úteis ao projeto, indo de encontro às funcionalidades necessárias do programa final.

#### Motivação

O React é um caso pouco comum, porque normalmente os projetos *open source* nunca têm grande projeção e vão evoluindo consoante o gosto e a paciência dos seus criadores porque não passa de um passatempo para os contribuidores. Neste caso, o projeto têm um propósito importante, é uma biblioteca usada para criar interfaces gráficas incorporada no Facebook. Só isso é um grande estímulo para todos os que ajudam o projeto, podem ver que todo o seu contributo é aplicado na maior rede social da atualidade.

#### Técnicas

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
