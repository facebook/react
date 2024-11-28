/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

// Declaração das variáveis que serão usadas nos testes
let React;
let act;
let Scheduler;
let ReactDOMClient;
let simulateEventDispatch;
let assertLog;

// Descrição do conjunto de testes para ReactInternalTestUtilsDOM
describe('ReactInternalTestUtilsDOM', () => {
  // Configuração inicial antes de cada teste
  beforeEach(() => {
    jest.resetModules();
    act = require('internal-test-utils').act;
    simulateEventDispatch = require('internal-test-utils').simulateEventDispatch;
    Scheduler = require('scheduler/unstable_mock');
    ReactDOMClient = require('react-dom/client');
    React = require('react');
    assertLog = require('internal-test-utils').assertLog;
  });

  // Descrição do conjunto de testes para simulateEventDispatch
  describe('simulateEventDispatch', () => {
    // Teste para verificar o agrupamento de eventos de captura discretos
    it('should batch discrete capture events', async () => {
      let childRef;
      function Component() {
        const [state, setState] = React.useState(0);
        Scheduler.log(`Render ${state}`);
        return (
          <div
            onClickCapture={() => {
              queueMicrotask(() => {
                Scheduler.log('Parent microtask');
              });
              setState(1);
              Scheduler.log('onClickCapture parent');
            }}>
            <button
              ref={ref => (childRef = ref)}
              onClickCapture={() => {
                queueMicrotask(() => {
                  Scheduler.log('Child microtask');
                });
                setState(2);
                Scheduler.log('onClickCapture child');
              }}
            />
          </div>
        );
      }

      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<Component />);
      });

      assertLog(['Render 0']);

      await act(async () => {
        await simulateEventDispatch(childRef, 'click');
      });

      // Verifica se os logs estão corretos
      assertLog([
        'onClickCapture parent',
        'onClickCapture child',
        'Parent microtask',
        'Render 2',
        'Child microtask',
      ]);

      document.body.removeChild(container);
    });

    // Teste para verificar o agrupamento de eventos de captura contínuos
    it('should batch continuous capture events', async () => {
      let childRef;
      function Component() {
        const [state, setState] = React.useState(0);
        Scheduler.log(`Render ${state}`);
        return (
          <div
            onMouseOutCapture={() => {
              queueMicrotask(() => {
                Scheduler.log('Parent microtask');
              });
              setState(1);
              Scheduler.log('onMouseOutCapture parent');
            }}>
            <button
              ref={ref => (childRef = ref)}
              onMouseOutCapture={() => {
                queueMicrotask(() => {
                  Scheduler.log('Child microtask');
                });
                setState(2);
                Scheduler.log('onMouseOutCapture child');
              }}
            />
          </div>
        );
      }

      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<Component />);
      });

      assertLog(['Render 0']);

      await act(async () => {
        await simulateEventDispatch(childRef, 'mouseout');
      });

      // Verifica se os logs estão corretos
      assertLog([
        'onMouseOutCapture parent',
        'onMouseOutCapture child',
        'Parent microtask',
        'Child microtask',
        'Render 2',
      ]);
    });

    // Teste para verificar o agrupamento de eventos de propagação discreta
    it('should batch bubbling discrete events', async () => {
      let childRef;
      function Component() {
        const [state, setState] = React.useState(0);
        Scheduler.log(`Render ${state}`);
        return (
          <div
            onClick={() => {
              queueMicrotask(() => {
                Scheduler.log('Parent microtask');
              });
              setState(1);
              Scheduler.log('onClick parent');
            }}>
            <button
              ref={ref => (childRef = ref)}
              onClick={() => {
                queueMicrotask(() => {
                  Scheduler.log('Child microtask');
                });
                setState(2);
                Scheduler.log('onClick child');
              }}
            />
          </div>
        );
      }

      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<Component />);
      });

      assertLog(['Render 0']);

      await act(async () => {
        await simulateEventDispatch(childRef, 'click');
      });

      // Verifica se os logs estão corretos
      assertLog([
        'onClick child',
        'onClick parent',
        'Child microtask',
        'Render 1',
        'Parent microtask',
      ]);
    });

    // Teste para verificar o agrupamento de eventos de propagação contínua
    it('should batch bubbling continuous events', async () => {
      let childRef;
      function Component() {
        const [state, setState] = React.useState(0);
        Scheduler.log(`Render ${state}`);
        return (
          <div
            onMouseOut={() => {
              queueMicrotask(() => {
                Scheduler.log('Parent microtask');
              });
              setState(1);
              Scheduler.log('onMouseOut parent');
            }}>
            <button
              ref={ref => (childRef = ref)}
              onMouseOut={() => {
                queueMicrotask(() => {
                  Scheduler.log('Child microtask');
                });
                setState(2);
                Scheduler.log('onMouseOut child');
              }}
            />
          </div>
        );
      }

      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<Component />);
      });

      assertLog(['Render 0']);

      await act(async () => {
        await simulateEventDispatch(childRef, 'mouseout');
      });

      // Verifica se os logs estão corretos
      assertLog([
        'onMouseOut child',
        'onMouseOut parent',
        'Child microtask',
        'Parent microtask',
        'Render 1',
      ]);
    });

    // Teste para verificar que eventos discretos não são agrupados entre manipuladores
    it('does not batch discrete events between handlers', async () => {
      let childRef = React.createRef();
      function Component() {
        const [state, setState] = React.useState(0);
        const parentRef = React.useRef();
        React.useEffect(() => {
          function handleParentEvent() {
            queueMicrotask(() => {
              Scheduler.log('Parent microtask');
            });
            setState(2);
            Scheduler.log(`Click parent`);
          }

          function handleChildEvent() {
            queueMicrotask(() => {
              Scheduler.log('Child microtask');
            });
            setState(1);
            Scheduler.log(`Click child`);
          }
          parentRef.current.addEventListener('click', handleParentEvent);

          childRef.current.addEventListener('click', handleChildEvent);

          return () => {
            parentRef.current.removeEventListener('click', handleParentEvent);

            childRef.current.removeEventListener('click', handleChildEvent);
          };
        });

        Scheduler.log(`Render ${state}`);
        return (
          <div ref={parentRef}>
            <button ref={childRef} />
          </div>
        );
      }

      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<Component />);
      });

      assertLog(['Render 0']);

      await act(async () => {
        await simulateEventDispatch(childRef.current, 'click');
      });

      // Verifica se os logs estão corretos
      assertLog([
        'Click child',
        'Child microtask',
        'Render 1',
        'Click parent',
        'Parent microtask',
        'Render 2',
      ]);
    });

    // Teste para verificar o agrupamento de eventos contínuos entre manipuladores
    it('should batch continuous events between handlers', async () => {
      let childRef = React.createRef();
      function Component() {
        const [state, setState] = React.useState(0);
        const parentRef = React.useRef();
        React.useEffect(() => {
          function handleChildEvent() {
            queueMicrotask(() => {
              Scheduler.log('Child microtask');
            });
            setState(1);
            Scheduler.log(`Mouseout child`);
          }
          function handleParentEvent() {
            queueMicrotask(() => {
              Scheduler.log('Parent microtask');
            });
            setState(2);
            Scheduler.log(`Mouseout parent`);
          }
          parentRef.current.addEventListener('mouseout', handleParentEvent);

          childRef.current.addEventListener('mouseout', handleChildEvent);

          return () => {
            parentRef.current.removeEventListener(
              'mouseout',
              handleParentEvent
            );

            childRef.current.removeEventListener('mouseout', handleChildEvent);
          };
        });

        Scheduler.log(`Render ${state}`);
        return (
          <div ref={parentRef}>
            <button ref={childRef} />
          </div>
        );
      }

      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<Component />);
      });

      assertLog(['Render 0']);

      await act(async () => {
        await simulateEventDispatch(childRef.current, 'mouseout');
      });

      // Verifica se os logs estão corretos
      assertLog([
        'Mouseout child',
        'Child microtask',
        'Mouseout parent',
        'Parent microtask',
        'Render 2',
      ]);
    });

    // Teste para verificar o agrupamento de eventos discretos entre manipuladores de diferentes raízes
    it('should flush discrete events between handlers from different roots', async () => {
      const childContainer = document.createElement('div');
      const parentContainer = document.createElement('main');

      const childRoot = ReactDOMClient.createRoot(childContainer);
      const parentRoot = ReactDOMClient.createRoot(parentContainer);
      let childSetState;

      function Parent() {
        // eslint-disable-next-line no-unused-vars
        const [state, _] = React.useState('Parent');
        const handleClick = () => {
          Promise.resolve().then(() => Scheduler.log('Flush Parent microtask'));
          childSetState(2);
          Scheduler.log('Parent click');
        };
        return <section onClick={handleClick}>{state}</section>;
      }

      function Child() {
        const [state, setState] = React.useState('Child');
        childSetState = setState;
        const handleClick = () => {
          Promise.resolve().then(() => Scheduler.log('Flush Child microtask'));
          setState(1);
          Scheduler.log('Child click');
        };
        Scheduler.log('Render ' + state);
        return <span onClick={handleClick}>{state}</span>;
      }

      await act(() => {
        childRoot.render(<Child />);
        parentRoot.render(<Parent />);
      });

      const childNode = childContainer.firstChild;
      const parentNode = parentContainer.firstChild;

      parentNode.appendChild(childContainer);
      document.body.appendChild(parentContainer);

      assertLog(['Render Child']);
      try {
        await act(async () => {
          await simulateEventDispatch(childNode, 'click');
        });

        // Verifica se os logs estão corretos
        assertLog([
          'Child click',
          'Flush Child microtask',
          'Render 1',
          'Parent click',
          'Flush Parent microtask',
          'Render 2',
        ]);
      } finally {
        document.body.removeChild(parentContainer);
      }
    });

    // Teste para verificar o agrupamento de eventos contínuos entre manipuladores de diferentes raízes
    it('should batch continuous events between handlers from different roots', async () => {
      const childContainer = document.createElement('div');
      const parentContainer = document.createElement('main');

      const childRoot = ReactDOMClient.createRoot(childContainer);
      const parentRoot = ReactDOMClient.createRoot(parentContainer);
      let childSetState;

      function Parent() {
        // eslint-disable-next-line no-unused-vars
        const [state, _] = React.useState('Parent');
        const handleMouseOut = () => {
          Promise.resolve().then(() => Scheduler.log('Flush Parent microtask'));
          childSetState(2);
          Scheduler.log('Parent mouseout');
        };
        return <section onMouseOut={handleMouseOut}>{state}</section>;
      }

      function Child() {
        const [state, setState] = React.useState('Child');
        childSetState = setState;
        const handleMouseOut = () => {
          Promise.resolve().then(() => Scheduler.log('Flush Child microtask'));
          setState(1);
          Scheduler.log('Child mouseout');
        };
        Scheduler.log('Render ' + state);
        return <span onMouseOut={handleMouseOut}>{state}</span>;
      }

      await act(() => {
        childRoot.render(<Child />);
        parentRoot.render(<Parent />);
      });

      const childNode = childContainer.firstChild;
      const parentNode = parentContainer.firstChild;

      parentNode.appendChild(childContainer);
      document.body.appendChild(parentContainer);

      assertLog(['Render Child']);
      try {
        await act(async () => {
          await simulateEventDispatch(childNode, 'mouseout');
        });

        // Verifica se os logs estão corretos
        assertLog([
          'Child mouseout',
          'Flush Child microtask',
          'Parent mouseout',
          'Flush Parent microtask',
          'Render 2',
        ]);
      } finally {
        document.body.removeChild(parentContainer);
      }
    });

    // Teste para verificar se eventos são disparados em nós removidos durante a distribuição
    it('should fire on nodes removed while dispatching', async () => {
      let childRef;
      function Component() {
        const parentRef = React.useRef();
        const middleRef = React.useRef();
        Scheduler.log(`Render`);
        return (
          <div
            ref={parentRef}
            onClick={() => {
              Scheduler.log('onMouseOut parent');
            }}>
            <div ref={middleRef}>
              <button
                ref={ref => (childRef = ref)}
                onClick={() => {
                  Scheduler.log('onMouseOut child');
                  childRef.parentNode.remove();
                }}
              />
            </div>
          </div>
        );
      }

      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<Component />);
      });

      assertLog(['Render']);

      await act(async () => {
        await simulateEventDispatch(childRef, 'click');
      });

      // Verifica se os logs estão corretos
      assertLog(['onMouseOut child', 'onMouseOut parent']);
    });

    // Teste para verificar se eventos não são disparados se o nó não estiver no documento
    it('should not fire if node is not in the document', async () => {
      let childRef;
      function Component() {
        Scheduler.log(`Render`);
        return (
          <div
            onMouseOut={() => {
              Scheduler.log('onMouseOut parent');
            }}>
            <button
              ref={ref => (childRef = ref)}
              onMouseOut={() => {
                Scheduler.log('onMouseOut child');
              }}
            />
          </div>
        );
      }

      // Não anexar a raiz ao documento.
      const root = ReactDOMClient.createRoot(document.createElement('div'));
      await act(() => {
        root.render(<Component />);
      });

      assertLog(['Render']);

      await act(async () => {
        await simulateEventDispatch(childRef, 'mouseout');
      });

      // Nenhum evento disparado, raiz não está no documento.
      assertLog([]);
    });
  });
});