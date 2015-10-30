# Relatório 3 - ESOF
## Facebook/React - Arquitetura de *Software*

### <a name="introducao"></a>Introdução

O objetivo deste relatório é a explicitação de alguns aspetos relativos à arquitetura do projeto React, seguindo o [modelo de vista 4+1](https://en.wikipedia.org/wiki/4%2B1_architectural_view_model). Serão apresentados vários diagramas exemplificativos.

Numa primeira fase, serão apresentados alguns conceitos sobre a biblioteca React considerados pertinentes para a compreensão do resto do relatório.

Numa segunda fase, serão apresentadas quatro componentes do modelo de vista acima referido, nomeadamente o diagrama de pacotes do projeto, referente à **vista lógica**, o diagrama de componentes, referente à **vista de implementação**, o diagrama de atividades, referente à **vista de processo**, e o diagrama de *deployment*, referente à **vista de _deployment_**, isto é, à vista de distribuição dos componentes de *software* do projeto em componentes de *hardware*.

### <a name="conceitos"></a>Conceitos

Nesta secção, serão explorados alguns conceitos importantes para a compreensão dos diagramas apresentados neste relatório.

#### <a name="virtual-dom"></a>*Virtual* DOM



### <a name="logica"></a>Vista Lógica

O seguinte diagrama de pacotes mostra a vista lógica referente ao projeto React.

![Diagrama de Pacotes](./Resources/package_diagram.jpg)

#### <a name="interpretacao-logica"></a>Interpretação

### <a name="implementacao"></a>Vista de Implementação

O seguinte diagrama de componentes mostra a vista de implementação referente ao projeto React.

![Diagrama de Componentes](./Resources/component_diagram.jpg)

#### <a name="interpretacao-implementacao"></a>Interpretação

De acordo com a interpretação dos autores deste relatório, a biblioteca React pode ser dividida em dois componentes essenciais. O primeiro componente incorpora a árvore DOM da página, que é o componente central da funcionalidade da biblioteca. Este componente trata os elementos definidos pelo utilizador (ver [Relatório 2](./Relatorio_2.md#casos-de-uso)), traduzindo-os numa árvore DOM que pode ser renderizada pelo *browser*. Como já foi referido em [relatórios anteriores](./Relatorio_2.md#isomorfismo-server-side-rendering), o processo de construção da árvore DOM é feito de forma muito eficiente, baseando-se na [determinação das diferenças](https://facebook.github.io/react/blog/2013/06/05/why-react.html#reactive-updates-are-dead-simple.) sofridas por cada elemento da interface.

O segundo componente integra o interpretador (*transformer*) de [JSX](https://facebook.github.io/react/docs/jsx-in-depth.html), uma extensão sintática semelhante a XML. Não é obrigatório recorrer à sintaxe JSX, embora a mesma permita definir a estrutura da árvore do documento de forma concisa e usando uma sintaxe com a qual a maior parte dos programadores está familiarizada. A sintaxe JSX é, depois, [transformada](https://facebook.github.io/react/docs/jsx-in-depth.html#the-transform) em código JavaScript, pronto a ser executado pela aplicação cliente.

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

O seguinte diagrama de *deployment* mostra a vista de *deployment* referente ao projeto React.

![Diagrama de Deployment](./Resources/Deployment_View.png)

#### <a name="interpretacao-deployment"></a>Interpretação

Do nosso ponto de vista, o diagrama anterior mostra-nos que o funcionamento da biblioteca React, na sua relação cliente-servidor, segue o padrão usado noutras arquiteturas semelhantes.

Contudo, o React apresenta uma funcionalidade muito útil. Quando a página é carregada pela primeira vez, a *DOM tree* é gerada pelo servidor e só depois enviada ao cliente. Com isto, poupam-se recursos ao cliente porque o processo de *parsing* da árvore é todo feito no servidor,não sobrecarregando o cliente.

### <a name="analise"></a>Análise Crítica

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
