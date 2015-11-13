# Relatório 4 - ESOF
## Facebook/React - Verificação e Validação de Software

### <a name="introducao"></a>Introdução

O objetivo deste relatório é a análise dos processos de verificação e validação (V&V) seguidos no desenvolvimento da biblioteca React, com a descrição de algumas das características deste projeto que digam respeito à aplicação desses processos.

Numa primeira fase, explorar-se-á o grau de testabilidade do *software*, analisando a [controlabilidade](#controllability) do estado dos componentes, a [observabilidade](#observability) dos resultados e a [isolabilidade](#isolateability) dos componentes, assim como o grau de [separação](#separation) de funcionalidades, de [inteligibilidade](#understandability) dos componentes e de [heterogeneidade](#heterogeneity) das tecnologias utilizadas.

Numa segunda fase, serão apresentadas algumas estatísticas pertinentes relacionadas com a verificação e validação do *software*.

Finalmente, será realizado um exercício que consistirá na seleção de um *bug report* e na conceção de casos de teste que possam, eventualmente, conduzir à resolução do mesmo.

### <a name="testabilidade"></a>Testabilidade do *Software*

A discussão que se desenrolará nesta secção incidirá sobre o quão testável o projeto React é, isto é, até que ponto é possível verificar e validar a implementação da biblioteca. A discussão será acompanhada de exemplos e de referências que suportem a interpretação dos autores sempre que for considerado pertinente.

#### <a name="controllability"></a>Controlabilidade

A biblioteca React define um conjunto de classes que implementam a sua funcionalidade, tirando partido do suporte à programação orientada por objetos, baseada na definição de protótipos, oferecido pelo JavaScript. Uma vez que é possível aceder, num dado instante, às [propriedades](http://www.w3schools.com/js/js_properties.asp) de um objeto, que podem ser atributos ou métodos, parece razoável admitir que é possível controlar o estado do mesmo, já que é possível conhecê-lo em cada momento. Visto que os testes unitários são realizados ao nível da classe e do método, é possível afirmar que, para esse tipo de testes, o estado do componente que está a ser testado é controlável. Os testes unitários sobre a biblioteca React são realizados com [Jest](https://facebook.github.io/jest/), como será explorado nas subsecções seguintes.

Outro tipo de testes que são realizados sobre a biblioteca React são os testes de integração que fazem uso da ferramenta [Travis CI](https://travis-ci.org/), conforme referido adiante. Estes testes são realizados ao nível do módulo, por exemplo, ao nível do pacote. No caso de um pacote, podemos definir o seu estado como sendo uma instanciação possível do conjunto das classes definidas nesse pacote. Uma vez que é possível conhecer o estado de cada objeto, conforme discutido no parágrafo anterior, também é possível conhecer o estado dessa instanciação, o que faz com que, neste caso, o componente a ser testado, um pacote ou módulo, também seja controlável.

Estes são os dois tipos de teste mais relevantes no contexto da biblioteca React.

#### <a name="observability"></a>Observabilidade

-- Referir logs do Travis CI; resultados dos testes unitários com Jest (e ReactTestUtils para simular eventos).

#### <a name="isolateability"></a>Isolabilidade

-- Referir a possibilidade de testes unitários com Jest, que permitem automaticamente isolar um módulo das suas dependências (https://facebook.github.io/jest/docs/automatic-mocking.html).

#### <a name="separation"></a>Separação de Funcionalidades

-- Referir o facto de a funcionalidade de cada classe/componente do React estar bem definida.



#### <a name="understandability"></a>Inteligibilidade

-- Documentação da API do React.

A biblioteca React [disponibiliza uma API](https://facebook.github.io/react/docs/top-level-api.html) dos vários recursos disponibilizados, que, no ponto de vista dos autores, é bastante extensiva e concisa. Para além desta documentação, é possível encontrar, ao longo do código, vários elementos (comentários, nomes de variáveis, ...), que permitem um maior esclarecimento das entidades aí presentes, tal como se verifica [neste exemplo](https://github.com/facebook/react/blob/master/src/renderers/dom/client/ReactMount.js).

Com estes elementos, é possível desenvolver um *test suit* que abranja um maior número de casos, o que permite detectar um maior número de *defects* no código.

#### <a name="heterogeneity"></a>Heterogeneidade

-- Referir que a utilização de um repositório Git que pode receber contribuições de muitos utilizadores conduz à necessidade de testes de integração com Travis CI, que são aplicados em paralelo com os testes unitários definidos com Jest.

Uma vez que o React é uma biblioteca *open-source*, e, por conseguinte, sujeita a contribuições de vários programadores, é necessário garantir que, após a aceitação e a incorporação das modificações dos *pull-requests*, o sistema permanece funcional. Desta forma é testada a integrabilidade do sistema, em paralelo com a realização de testes unitários incidentes nos vários elementos da biblioteca.
Por um lado, a realização de testes unitários ao nível da classe permite garantir a consistência dos elementos da biblioteca, com o recurso à *framework* [Jest](https://facebook.github.io/jest/). Por outra lado, é preciso averiguar se a integração dos vários elementos é feita de forma correcta. Nesta vertente, é utilizada a ferramenta [Travis CI](https://travis-ci.org/facebook/react), que premite automatizar este processo.


### <a name="estatisticas"></a>Estatísticas de Teste

-- Exemplos de logs do Travis CI. Tentar recolher estatísticas de cobertura dos testes Travis CI. Referir possibilidade de recolher estatísticas de cobertura com Jest (https://facebook.github.io/jest/docs/api.html#config-collectcoverage-boolean). Já publiquei no fórum: https://discuss.reactjs.org/t/line-coverage-for-tests-on-react/2479

### <a name="opcional"></a>Fix Bug Report 

Escolher um *bug* fácil de corrigir (eventualmente já corrigido), mas que permita ilustrar a utilização da framework Jest para a definição de testes unitários.

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

2015-11-22
