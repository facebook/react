# react-webmcp

React hooks and components for the [WebMCP](https://github.com/webmachinelearning/webmcp) standard — expose structured tools for AI agents on your website.

WebMCP is a W3C-proposed web standard (Chrome 146+) that allows websites to register tools that AI agents can discover and invoke directly, replacing unreliable screen-scraping with robust, schema-driven interaction.

> **Source repository:** This package is maintained at [tech-sumit/react-webmcp](https://github.com/tech-sumit/react-webmcp). For standalone usage, demo applications, and detailed documentation, see the source repo.

<table>
  <tr>
    <td>
      <img src="https://github.com/user-attachments/assets/6effbf70-c183-48da-b9f5-f344dbc23022" width="500" alt="Flight Search demo — Imperative API"/>
    </td>
    <td>
      <img src="https://github.com/user-attachments/assets/5673ec8e-4f35-46d7-a775-c8013c73838f" width="500" alt="French Bistro demo — Declarative API"/>
    </td>
  </tr>
</table>

## Installation

```sh
npm install react-webmcp
```

## Requirements

- **React** 18+
- **Chrome** 146.0.7672.0+ with the `WebMCP for testing` flag enabled

## Imperative API (Hooks)

Register tools as React hooks — they are automatically registered on mount and unregistered on unmount:

```js
import {useWebMCPTool} from 'react-webmcp';

function TodoApp() {
  useWebMCPTool({
    name: 'addTodo',
    description: 'Add a new item to the todo list',
    inputSchema: {
      type: 'object',
      properties: {
        text: {type: 'string', description: 'The todo item text'},
      },
      required: ['text'],
    },
    execute: ({text}) => {
      // Add the todo...
      return {content: [{type: 'text', text: `Added todo: ${text}`}]};
    },
  });
}
```

## Declarative API (Components)

Wrap standard HTML forms with WebMCP components to expose them as tools:

```js
import {WebMCPForm, WebMCPInput, WebMCPSelect} from 'react-webmcp';

function ReservationForm() {
  return (
    <WebMCPForm
      toolName="book_table"
      toolDescription="Book a table at the restaurant"
      onSubmit={e => {
        e.preventDefault();
        if (e.agentInvoked) {
          e.respondWith(Promise.resolve('Booking confirmed!'));
        }
      }}>
      <WebMCPInput
        name="name"
        type="text"
        toolParamDescription="Customer's full name"
        required
      />
      <WebMCPSelect name="guests" toolParamDescription="Number of guests">
        <option value="1">1 Person</option>
        <option value="2">2 People</option>
      </WebMCPSelect>
      <button type="submit">Book</button>
    </WebMCPForm>
  );
}
```

## API

### Hooks

- `useWebMCPTool(config)` — Register a single tool via `navigator.modelContext.registerTool()`.
- `useWebMCPContext({tools})` — Register multiple tools via `provideContext()`.
- `useToolEvent(event, callback, toolNameFilter?)` — Listen for `toolactivated` / `toolcancel` events.
- `useWebMCPStatus()` — Returns `{available, testingAvailable}` (requires `<WebMCPProvider>`).

### Components

- `<WebMCPForm>` — `<form>` with `toolname` / `tooldescription` attributes.
- `<WebMCPInput>` — `<input>` with `toolparamtitle` / `toolparamdescription`.
- `<WebMCPSelect>` — `<select>` with `toolparamtitle` / `toolparamdescription`.
- `<WebMCPTextarea>` — `<textarea>` with `toolparamtitle` / `toolparamdescription`.
- `<WebMCPProvider>` — Context provider for availability detection.

### Utilities

- `getModelContext()` — Returns `navigator.modelContext` or `null`.
- `isWebMCPAvailable()` — Returns `true` if the API is available.
- `isWebMCPTestingAvailable()` — Returns `true` if the testing/inspector API is available.

## Demos

Working demo applications are available in the [source repository](https://github.com/tech-sumit/react-webmcp):

- **[Flight Search](https://github.com/tech-sumit/react-webmcp/tree/master/demos/flight-search)** (Imperative API) — Replicates Google's [react-flightsearch](https://googlechromelabs.github.io/webmcp-tools/demos/react-flightsearch/) demo using `useWebMCPTool` hooks. Exposes 4 tools: `searchFlights`, `listFlights`, `setFilters`, `resetFilters`.
- **[French Bistro](https://github.com/tech-sumit/react-webmcp/tree/master/demos/french-bistro)** (Declarative API) — Replicates Google's [french-bistro](https://googlechromelabs.github.io/webmcp-tools/demos/french-bistro/) demo using `<WebMCPForm>` and `<WebMCPInput>` components. Exposes the `book_table_le_petit_bistro` tool.

To try them:

```sh
git clone https://github.com/tech-sumit/react-webmcp.git
cd react-webmcp/demos/flight-search  # or demos/french-bistro
npm install
npm run dev
```
