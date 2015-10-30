# Relatório 3 - ESOF
## Facebook/React - Arquitetura de *Software*

### <a name="introducao"></a>Introdução

O objetivo deste relatório é a explicitação de alguns aspetos relativos à arquitetura do projeto React, seguindo o [modelo de vista 4+1](https://en.wikipedia.org/wiki/4%2B1_architectural_view_model). Serão apresentados vários diagramas exemplificativos.

Numa primeira fase, serão apresentados alguns conceitos sobre a biblioteca React considerados pertinentes para a compreensão do resto do relatório.

Numa segunda fase, serão apresentadas quatro componentes do modelo de vista acima referido, nomeadamente o diagrama de pacotes do projeto, referente à **vista lógica**, o diagrama de componentes, referente à **vista de implementação**, o diagrama de atividades, referente à **vista de processo**, e o diagrama de *deployment*, referente à **vista de _deployment_**, isto é, à vista de distribuição dos componentes de *software* do projeto em componentes de *hardware*.

Note-se que o diagrama de casos de uso, correspondente à vista com a mesma designação, já foi apresentado no [relatório anterior](Relatorio_2.md#casos-de-uso).

### <a name="conceitos"></a>Conceitos

Nesta secção, serão explorados alguns conceitos importantes para a compreensão dos diagramas apresentados neste relatório.

#### <a name="virtual-dom"></a>*Virtual* DOM

A biblioteca React mantém uma representação em árvore dos elementos que serão mostrados pela aplicação, num conceito que é genericamente conhecido como [*Virtual* DOM](https://facebook.github.io/react/docs/glossary.html). Os [nós](https://facebook.github.io/react/docs/glossary.html#react-nodes) desta árvore podem ser [elementos](https://facebook.github.io/react/docs/glossary.html#react-elements), texto, valores numéricos ou um *array* de outros nós. Cada elemento pode conter descendentes, o que resulta numa estrutura em árvore. Como já foi referido no [relatório anterior](Relatorio_2.md#casos-de-uso), os elementos podem corresponder a *tags* de HTML ou, numa perspetiva mais interessante para quem utiliza a biblioteca, a [tipos de dados definidos pelo programador](https://facebook.github.io/react/docs/glossary.html#react-components).

Esta árvore será posteriormente traduzida numa árvore DOM inteligível pelo *browser*, que procederá à sua renderização com vista à apresentação da interface da aplicação. Esta tarefa de tradução da árvore virtual no DOM do documento é realizada pela classe [ReactDOM](https://facebook.github.io/react/docs/glossary.html#formal-type-definitions).

#### <a name="jsx"></a>Sintaxe JSX

[JSX](https://facebook.github.io/jsx/) é uma extensão sintática para JavaScript semelhante a XML, apresentado a vantagem de ser mais [intuitivo e familiar](https://facebook.github.io/jsx/#rationale) para a maior parte dos programadores, permitindo uma compreensão mais fácil da estrutura em árvore do DOM virtual da aplicação, devido ao equilíbro de *tags* de início e de fim.

O recurso a esta sintaxe é recomendado, mas não [obrigatório](https://facebook.github.io/react/docs/jsx-in-depth.html#why-jsx). Na realidade, o React [transformará a sintaxe JSX](https://facebook.github.io/react/docs/jsx-in-depth.html#the-transform) em JavaScript puro, pelo que a sua utilização tem como único objetivo acelerar o processo de desenvolvimento das aplicações que façam uso da biblioteca.

O [exemplo seguinte](https://facebook.github.io/react/docs/jsx-in-depth.html#child-expressions) ilustra a utlização da sintaxe JSX.

```javascript
var content = <Container>{window.isLoggedIn ? <Nav /> : <Login />}</Container>;
```

O código anterior é traduzido no seguinte código em JavaScript puro.

```javascript
var content = React.createElement(
  Container,
  null,
  window.isLoggedIn ? React.createElement(Nav) : React.createElement(Login)
);
```

A comparação entre estes dois blocos de código mostra a vantagem da utilização da sintaxe JSX, que permite escrever código mais conciso e intuitivo.

### <a name="logica"></a>Vista Lógica

O seguinte diagrama exprime os pacotes e as suas dependências, representação das abstrações chave do sistema, caracterizando a vista lógica referente ao projeto em estudo, React.

![Diagrama de Pacotes](./Resources/package_diagram.jpg)

#### <a name="interpretacao-logica"></a>Interpretação

A interpretação dos autores deste relatório referente a uma visão lógica da biblioteca *JavaScript* React foi traduzida no [diagrama de pacotes](#logica) anterior após esmiuçar a informação presente no [GitHub da biblioteca](https://github.com/facebook/react/tree/master/packages).

A [Vista Lógica](#logica) é constituída por quarto pacotes fundamentais à estruturação e funcionamento do projeto em estudo que são apresentandos de seguida.

O pacote **react** é um *npm package*, isto significa [Node Package Manager](https://en.wikipedia.org/wiki/Npm_(software)) que consiste num gestor de pacotes por defeito para a biblioteca *Node.js* de *JavaScript*. Desta forma, este pacote consegue imediato acesso ao [React](https://facebook.github.io/react), sem requerer transformações *JSX*, uma extensão sintática semelhante a XML que será explicado mais [à frente](#interpretacao-implementacao). Este aspeto é especialmente útil para casos onde é desejado *browserify* - requerer módulos no *browser* -  usando React.

O pacote **react-dom** serve como ponto de entrada do DOM que vai traduzir a árvore [Virtual DOM](#virtual-dom) no DOM do *browser*. Destina-se a ser emparelhado usando isomorfismo, um [conceito abordado no Relatório 2](./Relatorio_2.md#isomorfismo-server-side-rendering), que serão enviados como *npm*:

> npm install react react-dom

O pacote **react-addons** ...

### <a name="implementacao"></a>Vista de Implementação

Um [diagrama de componentes](https://en.wikipedia.org/wiki/Component_diagram) representa o modo como os componentes de um sistema de *software* estão relacionados entre si. Os componentes podem ser ligados por meio de um conector designado de *assembly connector*, que indica quais as interfaces fornecidas e usadas por um dado componente.

O diagrama de componentes seguinte concretiza a vista de implementação referente à biblioteca React.

![Diagrama de Componentes](./Resources/component_diagram.jpg)

#### <a name="interpretacao-implementacao"></a>Interpretação

De acordo com a interpretação dos autores deste relatório, a biblioteca React pode ser dividida em dois componentes essenciais. O primeiro componente incorpora a árvore DOM da página, que é o componente central da funcionalidade da biblioteca. Este componente trata os elementos definidos pelo utilizador (ver [Relatório 2](./Relatorio_2.md#casos-de-uso)), traduzindo-os numa árvore DOM que pode ser renderizada pelo *browser*. Como já foi referido em [relatórios anteriores](./Relatorio_2.md#isomorfismo-server-side-rendering), o processo de construção da árvore DOM é feito de forma muito eficiente, baseando-se na [determinação das diferenças](https://facebook.github.io/react/blog/2013/06/05/why-react.html#reactive-updates-are-dead-simple.) sofridas por cada elemento da interface.

O segundo componente integra o interpretador (*transformer*) de [JSX](https://facebook.github.io/react/docs/jsx-in-depth.html). Não é obrigatório recorrer à sintaxe JSX, embora a mesma permita definir a estrutura da árvore do documento de forma concisa e usando uma sintaxe com a qual a maior parte dos programadores está familiarizada. A sintaxe JSX é, depois, [transformada](https://facebook.github.io/react/docs/jsx-in-depth.html#the-transform) em código JavaScript, pronto a ser executado pela aplicação cliente.

É do entender dos autores deste relatório que existem distinções suficientes entre estes dois conjuntos de funcionalidades, justificando a sua classificação em dois componentes diferentes.


### <a name="processo"></a>Vista de Processo

Nesta diagrama, pretende-se focalizar os vários aspectos dinâmicos da arquitectura do React, isto é, detalhar o comportamento que a biblioteca pode ter ao longo da sua execução. Dado que a biblioteca possui uma estrutura bastante complexa, e que, neste relatório, não se pretende detalhar exaustivamente o comportamento da mesma, é focalizada, nesta secção, a execução no lado do cliente ([client-side](https://en.wikipedia.org/wiki/Client-side)), que pode ser manifestada num *browser*.

![Diagrama de Actividade](./Resources/Client Activity Diagram.jpg)

#### <a name="interpretacao-processo"></a>Interpretação

Como já fora referido no [relatório anterior](./Relatorio_2.md#isomorfismo-server-side-rendering), pode recorrer-se ao **isomorfismo** por forma a acelerar todo o processo de renderização da página. Utilizando esta propriedade, a primeira versão da *web page* é renderizada no servidor, e as subsequentes modificações serão renderizadas no lado do cliente. Desta forma, no *client-side*, apenas se procede a alterações na estrutura da árvore virtual DOM (*Virtual DOM Tree*), ao invés de a construir na totalidade, tornando, assim, o processo mais eficiente. Posteriormente, a *Virtual DOM Tree* é convertida numa *DOM Tree* que possa ser avaliada pelo browser.

Na eventualidade de um dado elemento da página sofrer alterações quer externas (causadas por acções do utilizador) quer internas (devido a interrupções periódicas, por exemplo), a *virtual DOM Tree* é, de novo, renderizada, através da invocação do método *render* da *ReactDOM*. Contudo, em vez de se renderizar a árvore na totalidade, apenas se altera os elementos que sofreram as tais alterações, evitando, desta forma, a realização de computações desnecessárias, tornando o processo de actualização mais eficiente.

Neste método, é invocado o método 'render' de cada elemento, que retorna uma *Virtual DOM Tree* actualizada desse mesmo elemento. Subsequentemente, possuindo todas as *Virtual DOM Trees* de todos os elemntos da página, cada uma dessas árvores é comparada com a versão actual do respectivo elemento(isto é, ainda não actualizada), utilizando uma versão modificada do utilitário 'diff'. O resultado será um conjunto de alterações a serem realizadas na DOM Tree actual. Após a aplicação dessas alterações, a página actual será actualizada.

Note-se que esta actualização **parcial** da DOM Tree, com recurso a [heurísticas](http://facebook.github.io/react/docs/reconciliation.html), é uma das características que torna esta biblioteca diferente das outras, garantindo, desta forma, uma maior eficiência na actualização da página.


### <a name="deployment"></a>Vista de *Deployment*

Antes da apresentação do diagrama de *deployment*, faz sentido explicar em que consiste este conceito para uma melhor interpretação das conclusões obtidas.
Este tipo de esquema, permite ao programador mostrar aos interessados, que usem o seu projecto, qual é o seu processo de funcionamento ao mais alto nível em *run time*. Para isso, são apresentados os componentes e *devices* usados, unidos entre si (nos casos em que isso faça sentido) representando as ligações que ocorrem quando está em funcionamento.

Em seguida, é apresentado este tipo de diagrama para a biblioteca em estudo, o React.

![Diagrama de Deployment](./Resources/Deployment_View.png)

#### <a name="descricao-deployment"></a>Descrição

De acordo com a análise do diagrama anterior, o mesmo mostra-nos que o funcionamento da biblioteca React, na sua relação cliente-servidor, segue o padrão usado noutras arquiteturas semelhantes. O cliente quando, por intermédio de alguma ação, ativa algum evento, faz um pedido ao servidor. Em seguida, cabe ao servidor processar esse pedido e enviar a resposta.

Contudo, o React, ao nível do servidor, apresenta uma funcionalidade diferente. Quando a página é carregada pela primeira vez, é criada, pelo servidor, uma *virtual DOM tree*, que vai ser a base de todas as próximas árvores criadas, ao longo da utilização, no browser. Em seguida, ela é enviada ao cliente para o mesmo criar a *DOM tree*, no fim do processo de criação é invocado o método render para a informação guardada na árvore ser mostrada no browser.
Através desta funcionaliade, é possível pouparem-se recursos ao cliente na geração da *virtual DOM tree* base, porque todo o seu processamento é feito pelo servidor. A partir deste momento, todos pedidos feitos pelo cliente e respetivas respostas do servidor vão gerar alterações. Tendo em conta estas alterações, é calculado o mínimo de mudanças à *DOM tree* do cliente de modo a que sejam representadas as mudanças requeridas pelo cliente. Fazendo-se apenas as mudanças na árvore do cliente, evita a necessidade de um processamento completo de uma nova árvore, o que tornaria todo o processo menos eficiente, o qual está descrito na [secção anterior](#interpretacao-processo).

### <a name="analise"></a>Análise Crítica

É importante reiterar a ideia que foi já referida ao longo do relatório. Todos os diagramas apresentados neste relatório foram construídos pelos autores do mesmo, os quais se basearam unicamente na sua interpretação acerca dos diversos aspetos do projeto. É possível que interpretações distintas pudessem conduzir a diagramas diferentes.

Relativamente à vista de implementação, expressa por um diagrama de componentes, parece-nos existir uma clara distinção entre as funções de interpretação da sintaxe JSX e de tratamento da árvore DOM da página, justificando-se a sua divisão em dois componentes diferentes.

### <a name="info"></a>Informações

##### Autores:

* António Casimiro (antonio.casimiro@fe.up.pt)
	* Número de horas despendidas: 
	* Contribuição: 
* Diogo Amaral (diogo.amaral@fe.up.pt)
	* Número de horas despendidas: 
	* Contribuição: 
* Pedro Silva (pedro.silva@fe.up.pt)
	* Número de horas despendidas: 
	* Contribuição: 
* Rui Cardoso (rui.peixoto@fe.up.pt)
	* Número de horas despendidas: 
	* Contribuição: 

Faculdade de Engenharia da Universidade do Porto - MIEIC

2015-11-01
