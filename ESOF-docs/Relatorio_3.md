# Relatório 3 - ESOF
## Facebook/React - Arquitetura de *Software*

### <a name="introducao"></a>Introdução

--> Esclarecimento do conceito de "Virtual DOM Tree".




### <a name="logica"></a>Vista Lógica

O seguinte diagrama de pacotes mostra a vista lógica referente ao projeto React.

![Diagrama de Pacotes](./Resources/package_diagram.jpg)

#### <a name="descricao-logica"></a>Descrição

### <a name="implementacao"></a>Vista de Implementação

O seguinte diagrama de componentes mostra a vista de implementação referente ao projeto React.

![Diagrama de Componentes](./Resources/component_diagram.jpg)

A biblioteca React pode ser dividida em dois componentes essenciais: o componente que trata a árvore DOM da página, que é o componente central da funcionalidade da biblioteca, e o interpretador da sintaxe JSX.

#### <a name="descricao-implementacao"></a>Descrição




### <a name="processo"></a>Vista de Processo


Vai-se, de seguida, apresentar o diagrama relativo aos aspectos dinâmicos da Biblioteca React. Dado que a biblioteca possui uma estrutura bastante complexa, e que, neste relatório, não se pretende, exaustivamente, detalhar o comportamento da mesma, é focalizado, nesta secção, a execução no lado do cliente (client-side scripting), como, por exemplo, num browser.

![Diagrama de Actividade](./Resources/Client Activity Diagram.jpg)

Uma das principais vantagens desta biblioteca é que apenas renderiza a parte que fora modificada, sendo este processo bastante optimizado.

#### <a name="descricao-processo"></a>Descrição

No ponto de vista dos autores do relatório, o conjunto de actividades que ocorrem no lado do cliente é aquele que aparenta possuir uma maior relevância, tendo em conta o âmbito e objectivo deste relatório. Desta forma, será descrito esse mesmo conjunto de seguida. 

Como já fora referido no Relatório 2, pode usar-se *isomorfismo* por forma a acelerar todo o processo de renderização da página, isto é, proceder-se à utilização do mesmo código quer no cliente, quer no servidor. Assim, é possível que o cliente apenas proceda a alterações na estrutura da árvore virtual DOM, ao invés de a construir na totalidade. 
Desta forma, inicialmente, o cliente recebe essa árvore originária do servidor, e, seguidamente, no lado do cliente, proceder-se à construção da DOM Tree, que irá ser utilizada, posteriormente, pelo browser, de maneira a construir a página web.

Na eventualidade de a página ser alterada, é invocado o método 'render' do componente em questão, que retorna uma Virtual DOM Tree actualizada desse mesmo componente. Subsequentemente, possuindo todas as Virtual DOM Trees de todos os componentes que sofreram alterações, cada uma dessas árvores é comparada, utilizando uma versão modificada do utilitário 'diff', com a árvore corrente do respectivo componente. O resultado será a construção de um conjunto de alterações a serem realizadas na Virtual DOM Tree actual.

Após a aplicação dessas alterações, o browser procede à construção da DOM Tree já actualizada, actualizando, desta forma, o conteúdo actual a ser mostrado.




### <a name="deployment"></a>Vista de *Deployment*

O seguinte diagrama de *deployment* mostra a vista de *deployment* referente ao projeto React.

![Diagrama de Deployment](./Resources/Deployment_View.png)

#### <a name="descricao-deployment"></a>Descrição

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
