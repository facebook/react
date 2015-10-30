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

A interpretação dos autores deste relatório referente a uma visão lógica da biblioteca JavaScript React foi traduzida no [diagrama de pacotes](#logica) anterior após esmiuçar a informação presente no [GitHub da biblioteca](https://github.com/facebook/react/tree/master/packages).


### <a name="implementacao"></a>Vista de Implementação

O seguinte diagrama de componentes mostra a vista de implementação referente ao projeto React.

![Diagrama de Componentes](./Resources/component_diagram.jpg)

#### <a name="interpretacao-implementacao"></a>Interpretação

De acordo com a interpretação dos autores deste relatório, a biblioteca React pode ser dividida em dois componentes essenciais. O primeiro componente incorpora a árvore DOM da página, que é o componente central da funcionalidade da biblioteca. Este componente trata os elementos definidos pelo utilizador (ver [Relatório 2](./Relatorio_2.md#casos-de-uso)), traduzindo-os numa árvore DOM que pode ser renderizada pelo *browser*. Como já foi referido em [relatórios anteriores](./Relatorio_2.md#isomorfismo-server-side-rendering), o processo de construção da árvore DOM é feito de forma muito eficiente, baseando-se na [determinação das diferenças](https://facebook.github.io/react/blog/2013/06/05/why-react.html#reactive-updates-are-dead-simple.) sofridas por cada elemento da interface.

O segundo componente integra o interpretador (*transformer*) de [JSX](https://facebook.github.io/react/docs/jsx-in-depth.html), uma extensão sintática semelhante a XML. Não é obrigatório recorrer à sintaxe JSX, embora a mesma permita definir a estrutura da árvore do documento de forma concisa e usando uma sintaxe com a qual a maior parte dos programadores está familiarizada. A sintaxe JSX é, depois, [transformada](https://facebook.github.io/react/docs/jsx-in-depth.html#the-transform) em código JavaScript, pronto a ser executado pela aplicação cliente.

É do entender dos autores deste relatório que existem distinções suficientes entre estes dois conjuntos de funcionalidades, justificando a sua classificação em dois componentes diferentes.

### <a name="processo"></a>Vista de Processo

Apresenta-se, de seguida, o diagrama de atividade da biblioteca React. Dado que a biblioteca possui uma estrutura bastante complexa, e que, neste relatório, não se pretende, exaustivamente, detalhar o comportamento da mesma, é focalizado, nesta secção, a execução no lado do cliente (client-side scripting), como, por exemplo, num browser.

![Diagrama de Actividade](./Resources/Client Activity Diagram.jpg)

Uma das principais vantagens desta biblioteca é que apenas renderiza a parte que fora modificada, sendo este processo bastante optimizado.

#### <a name="interpretacao-processo"></a>Interpretação

No ponto de vista dos autores do relatório, o conjunto de actividades que ocorrem no lado do cliente é aquele que aparenta possuir uma maior relevância, tendo em conta o âmbito e objectivo deste relatório. Desta forma, será descrito esse mesmo conjunto de seguida. 

Como já fora referido no Relatório 2, pode usar-se *isomorfismo* por forma a acelerar todo o processo de renderização da página, isto é, proceder-se à utilização do mesmo código quer no cliente, quer no servidor. Assim, é possível que o cliente apenas proceda a alterações na estrutura da árvore virtual DOM, ao invés de a construir na totalidade. 
Desta forma, inicialmente, o cliente recebe essa árvore originária do servidor, e, seguidamente, no lado do cliente, proceder-se à construção da DOM Tree, que irá ser utilizada, posteriormente, pelo browser, de maneira a construir a página web.

Na eventualidade de a página ser alterada, é invocado o método 'render' do componente em questão, que retorna uma Virtual DOM Tree actualizada desse mesmo componente. Subsequentemente, possuindo todas as Virtual DOM Trees de todos os componentes que sofreram alterações, cada uma dessas árvores é comparada, utilizando uma versão modificada do utilitário 'diff', com a árvore corrente do respectivo componente. O resultado será a construção de um conjunto de alterações a serem realizadas na Virtual DOM Tree actual.

Após a aplicação dessas alterações, o browser procede à construção da DOM Tree já actualizada, actualizando, desta forma, o conteúdo actual a ser mostrado.

### <a name="deployment"></a>Vista de *Deployment*

Antes da apresentação do diagrama de *deployment*, faz sentido explicar em que consiste este conceito para uma melhor interpretação das conclusões obtidas.
Este tipo de esquema, permite ao programador mostrar aos interessados, que usem o seu projecto, qual é o seu processo de funcionamento ao mais alto nível em *run time*. Para isso, são apresentados os componentes e *devices* usados, unidos entre si (nos casos em que isso faça sentido) representando as ligações que ocorrem quando está em funcionamento.

Em seguida, é apresentado este tipo de diagrama para a biblioteca em estudo, o React.

![Diagrama de Deployment](./Resources/Deployment_View.png)

#### <a name="descricao-deployment"></a>Descrição

De acordo com a análise do diagrama anterior, o mesmo mostra-nos que o funcionamento da biblioteca React, na sua relação cliente-servidor, segue o padrão usado noutras arquiteturas semelhantes. O cliente quando, por intermédio de alguma ação, ativa algum evento, faz um pedido ao servidor. Em seguida, cabe ao servidor processar esse pedido e enviar a resposta.

Contudo, o React, ao nível do servidor, apresenta uma funcionalidade diferente do usual. Quando a página é carregada pela primeira vez, a *virtual DOM tree* é gerada pelo servidor e só depois enviada ao cliente. Através desta inovação, é possível pouparem-se recursos ao cliente na geração da mesma. A partir deste momento, todos pedidos feitos pelo cliente e respetivas respostas do servidor vão levar a alterações apenas à *DOM tree* do cliente. Todo este processo já foi descrito na [secção anterior](#interpretacao-processo).

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
