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

A biblioteca React pode ser dividida em dois componentes essenciais: o componente que trata a árvore DOM da página, que é o componente central da funcionalidade da biblioteca, e o interpretador da sintaxe JSX.

#### <a name="descricao-implementacao"></a>Descrição




### <a name="processo"></a>Vista de Processo


Vai-se, de seguida, apresentar o diagrama relativo aos aspectos dinâmicos da Biblioteca React. Dado que a biblioteca possui uma estrutura bastante complexa, e que, neste relatório, não se pretende, exaustivamente, detalhar o comportamento da mesma, é focalizada, nesta secção, a execução no lado do cliente, como, por exemplo, num browser.

![Diagrama de Actividade](./Resources/Client Activity Diagram.jpg)

Uma das principais vantagens desta biblioteca é que apenas renderiza a parte que fora modificada, sendo este processo bastante optimizado.

#### <a name="descricao-processo"></a>Descrição





### <a name="deployment"></a>Vista de *Deployment*

O seguinte diagrama de *deployment* mostra a vista de *deployment* referente ao projeto React.

![Diagrama de Deployment](./Resources/Deployment_View.png)

#### <a name="descricao-deployment"></a>Descrição
Do nosso ponto de vista, o diagrama anterior mostra-nos que o funcionamento da biblioteca React, na sua relação cliente-servidor, segue o padrão usado noutras arquiteturas semelhantes.
Contudo, o React apresenta uma funcionalidade muito útil. Quando a página é carregada pela primeira vez, a *DOM tree* é gerada pelo servidor e só depois enviada ao cliente. Com isto, poupam-se recursos ao cliente porque o processo de *parsing* da árvore é todo feito no servidor,não sobrecarregando o cliente.

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
