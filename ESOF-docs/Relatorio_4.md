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

-- Referir o estado de um objeto, ao nível da classe, e as interações entre objetos, ao nível do pacote.

#### <a name="observability"></a>Observabilidade

-- Referir logs do Travis CI; resultados dos testes unitários com Jest (e ReactTestUtils para simular eventos).

#### <a name="isolateability"></a>Isolabilidade

-- Referir a possibilidade de testes unitários com Jest, que permitem automaticamente isolar um módulo das suas dependências (https://facebook.github.io/jest/docs/automatic-mocking.html).

#### <a name="separation"></a>Separação de Funcionalidades

-- Referir o facto de a funcionalidade de cada classe/componente do React estar bem definida.

#### <a name="understandability"></a>Inteligibilidade

-- Documentação da API do React.

#### <a name="heterogeneity"></a>Heterogeneidade

-- Referir que a utilização de um repositório Git que pode receber contribuições de muitos utilizadores conduz à necessidade de testes de integração com Travis CI, que são aplicados em paralelo com os testes unitários definidos com Jest.

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
