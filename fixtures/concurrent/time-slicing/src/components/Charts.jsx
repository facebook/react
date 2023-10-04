import React from "react";
import {
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryBar,
  VictoryTheme,
  VictoryScatter,
  VictoryStack,
} from "victory";

import _map from "lodash/map";

import { COLORS } from "../constants";

const Charts = ({ data, isPending }) =>
  isPending ? (
    <span>Transition ongoing...</span>
  ) : (
    <div>
      <div style={{ display: "flex" }}>
        <VictoryChart
          theme={VictoryTheme.material}
          width={400}
          height={400}
          style={{
            parent: {
              backgroundColor: "#222",
            },
          }}
        >
          <VictoryAxis
            style={{
              axis: { stroke: "white" },
              tickLabels: { fill: "white" },
            }}
          />
          <VictoryAxis
            style={{
              axis: { stroke: "white" },
              tickLabels: { fill: "white" },
            }}
            dependentAxis
          />
          <VictoryScatter
            data={data[0]}
            size={6}
            style={{
              data: {
                fill: (d) => COLORS[d.x % 5],
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
              backgroundColor: "#222",
            },
          }}
          domainPadding={[20, 20]}
        >
          <VictoryAxis
            style={{
              axis: { stroke: "white" },
              tickLabels: { fill: "white" },
            }}
          />
          <VictoryAxis
            style={{
              axis: { stroke: "white" },
              tickLabels: { fill: "white" },
            }}
            dependentAxis
          />
          <VictoryBar
            data={data[0]}
            style={{
              data: {
                fill: (d) => COLORS[d.x % 5],
                stroke: "none",
                padding: 5,
              },
            }}
          />
        </VictoryChart>
      </div>
      <div
        style={{
          display: "flex",
          position: "relative",
          top: "-50px",
        }}
      >
        <VictoryChart
          theme={VictoryTheme.material}
          width={800}
          height={350}
          style={{
            parent: {
              backgroundColor: "#222",
            },
          }}
        >
          <VictoryAxis
            style={{
              axis: { stroke: "white" },
              tickLabels: { fill: "white" },
            }}
          />
          <VictoryAxis
            style={{
              axis: { stroke: "white" },
              tickLabels: { fill: "white" },
            }}
            dependentAxis
          />
          <VictoryStack>
            {_map(data, (row, i) => (
              <VictoryArea key={i} data={row} colorScale={COLORS} />
            ))}
          </VictoryStack>
        </VictoryChart>
      </div>
    </div>
  );

export default Charts;
