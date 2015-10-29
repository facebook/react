# Relatório 3 - ESOF
## Facebook/React - Arquitetura de *Software*

### <a name="introducao"></a>Introdução


### <a name="logica"></a>Vista Lógica

O seguinte diagrama de pacotes mostra a vista lógica referente ao projeto React.

![Diagrama de Pacotes](./Resources/package_diagram.jpg)

#### <a name="descricao-logica"></a>Descrição

### <a name="implementacao"></a>Vista de Implementação

O seguinte diagrama de componentes mostra a vista de implementação referente ao projeto React.

![Diagrama de Componentes](./Resources/component_diagram.jpg)

#### <a name="descricao-implementacao"></a>Descrição

De acordo com a interpretação dos autores deste relatório, a biblioteca React pode ser dividida em dois componentes essenciais. O primeiro componente incorpora a árvore DOM da página, que é o componente central da funcionalidade da biblioteca. Este componente trata os elementos definidos pelo utilizador (ver [Relatório 2](./Relatorio_2.md#casos-de-uso)), traduzindo-os numa árvore DOM que pode ser renderizada pelo *browser*. Como já foi referido em [relatórios anteriores](./Relatorio_2.md#isomorfismo-server-side-rendering), o processo de construção da árvore DOM é feito de forma muito eficiente, baseando-se na [determinação das diferenças](https://facebook.github.io/react/blog/2013/06/05/why-react.html#reactive-updates-are-dead-simple.) sofridas por cada elemento da interface.

O segundo componente integra o interpretador (*transformer*) de [JSX](https://facebook.github.io/react/docs/jsx-in-depth.html), uma extensão sintática semelhante a XML. Não é obrigatório recorrer à sintaxe JSX, embora a mesma permita definir a estrutura da árvore do documento de forma concisa e usando uma sintaxe com a qual a maior parte dos programadores está familiarizada. A sintaxe JSX é, depois, [transformada](https://facebook.github.io/react/docs/jsx-in-depth.html#the-transform) em código JavaScript, pronto a ser executado pela aplicação cliente.

É do entender dos autores deste relatório que existem distinções suficientes entre estes dois conjuntos de funcionalidades, justificando a sua classificação em dois componentes diferentes.

### <a name="processo"></a>Vista de Processo


O seguinte diagrama de componentes mostra a vista de processo referente ao projeto React.

A biblioteca React é uma estrutura bastante complexa e passível 

Vamos focalizar-nos no fluxo de actividades que ocorre no cliente, isto é, num browser:
![Diagrama de Actividade](./Resources/Client Activity Diagram.jpg)

Uma das principais vantagens desta biblioteca é que apenas renderiza a parte que fora modificada, sendo este processo bastante optimizado.

#### <a name="descricao-processo"></a>Descrição





### <a name="deployment"></a>Vista de *Deployment*

O seguinte diagrama de *deployment* mostra a vista de *deployment* referente ao projeto React.

![Diagrama de Deployment](./Resources/Deployment_View.png)

#### <a name="descricao-deployment"></a>Descrição

#### <a name="analise"></a>Análise Crítica

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
