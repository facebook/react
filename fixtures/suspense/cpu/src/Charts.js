import React, {PureComponent} from 'react';
import {
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryBar,
  VictoryTheme,
  VictoryScatter,
  VictoryStack,
} from 'victory';

const colors = ['#fff489', '#fa57c1', '#b166cc', '#7572ff', '#69a6f9'];

export default class Charts extends PureComponent {
  render() {
    const streamData = this.props.data;
    return (
      <div>
        <div style={{display: 'flex'}}>
          <VictoryChart
            theme={VictoryTheme.material}
            width={400}
            height={400}
            style={{
              parent: {
                backgroundColor: '#222',
              },
            }}>
            <VictoryAxis
              style={{
                axis: {stroke: 'white'},
                tickLabels: {fill: 'white'},
              }}
            />
            <VictoryAxis
              style={{
                axis: {stroke: 'white'},
                tickLabels: {fill: 'white'},
              }}
              dependentAxis
            />
            <VictoryScatter
              data={streamData[0]}
              size={6}
              style={{
                data: {
                  fill: d => colors[d.x % 5],
                },
              }}
            />
          </VictoryChart>

          <VictoryChart
            theme={VictoryTheme.material}
            width={400}
            height={400}
            style={{
              parent: {
                backgroundColor: '#222',
              },
            }}
            domainPadding={[20, 20]}>
            <VictoryAxis
              style={{
                axis: {stroke: 'white'},
                tickLabels: {fill: 'white'},
              }}
            />
            <VictoryAxis
              style={{
                axis: {stroke: 'white'},
                tickLabels: {fill: 'white'},
              }}
              dependentAxis
            />
            <VictoryBar
              data={streamData[0]}
              style={{
                data: {
                  fill: d => colors[d.x % 5],
                  stroke: 'none',
                  padding: 5,
                },
              }}
            />
          </VictoryChart>
        </div>
        <div
          style={{
            display: 'flex',
            position: 'relative',
            top: '-50px',
          }}>
          <VictoryChart
            theme={VictoryTheme.material}
            width={800}
            height={350}
            style={{
              parent: {
                backgroundColor: '#222',
              },
            }}>
            <VictoryAxis
              style={{
                axis: {stroke: 'white'},
                tickLabels: {fill: 'white'},
              }}
            />
            <VictoryAxis
              style={{
                axis: {stroke: 'white'},
                tickLabels: {fill: 'white'},
              }}
              dependentAxis
            />
            <VictoryStack>
              {streamData.map((data, i) => (
                <VictoryArea key={i} data={data} colorScale={colors} />
              ))}
            </VictoryStack>
          </VictoryChart>
        </div>
      </div>
    );
  }
}
