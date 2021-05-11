// magic variables + memoCache
function TodoList1({ visibility, themeColor }) {
  const [todos, setTodos] = useState(initialTodos);

  let hasVisibilityChanged, hasThemeColorChanged, hasTodosChanged;

  const handleChange = todo => setTodos(todos => getUpdated(todos, todo));

  const filtered = getFiltered(todos, visibility);

  return (
    <div>
      <ul>
        {filtered.map(todo => (
          <Todo key={todo.id} todo={todo} onChange={handleChange} />
        ))}
      </ul>
      <AddTodo setTodos={setTodos} themeColor={themeColor} />
    </div>
  );
}

function TodoList1({ visibility, themeColor }) {
  const [todos, setTodos] = useState(initialTodos);

  let hasVisibilityChanged, hasThemeColorChanged, hasTodosChanged;

  const handleChange = todo => setTodos(todos => getUpdated(todos, todo));

  if (hasVisibilityChanged || hasTodosChanged) {
    const filtered = getFiltered(todos, visibility);
  }

  return (
    <div>
      <ul>
        {filtered.map(todo => (
          <Todo key={todo.id} todo={todo} onChange={handleChange} />
        ))}
      </ul>
      <AddTodo setTodos={setTodos} themeColor={themeColor} />
    </div>
  );
}

function TodoList1({ visibility, themeColor }) {
  const [todos, setTodos] = useState(initialTodos);

  let hasVisibilityChanged, hasThemeColorChanged, hasTodosChanged, memoCache;

  const handleChange =
    memoCache[0] ||
    (memoCache[0] = todo => setTodos(todos => getUpdated(todos, todo)));

  let filtered;
  if (hasVisibilityChanged || hasTodosChanged) {
    filtered = memoCache[0] = getFiltered(todos, visibility);
  } else {
    filtered = memoCache[0];
  }

  return (
    <div>
      <ul>
        {filtered.map(todo => (
          <Todo key={todo.id} todo={todo} onChange={handleChange} />
        ))}
      </ul>
      <AddTodo setTodos={setTodos} themeColor={themeColor} />
    </div>
  );
}

// middle - demo the idea that we only want to excute a line of code unless
// its dependencies chagned.
function TodoList2({ visibility, themeColor }) {
  const [todos, setTodos] = useState(initialTodos);

  let hasVisibilityChanged, hasThemeColorChanged, hasTodosChanged;

  if (hasVisibilityChanged || hasThemeColorChanged || hasTodosChanged) {
    const handleChange = todo => setTodos(todos => getUpdated(todos, todo));

    if (hasVisibilityChanged || hasTodosChanged) {
      const filtered = getFiltered(todos, visibility);
      const jsx_todos = filtered.map(todo => (
        <Todo key={todo.id} todo={todo} onChange={handleChange} />
      ));
    }

    if (hasThemeColorChanged) {
      const jsx_addTodo = (
        <AddTodo setTodos={setTodos} themeColor={themeColor} />
      );
    }
    return (
      <div>
        <ul>{jsx_todos}</ul>
        {jsx_addTodo}
      </div>
    );
  }
}

//
function TodoList({ visibility, themeColor }) {
  const [todos, setTodos] = useState(initialTodos);

  let hasVisibilityChanged, hasThemeColorChanged, hasTodosChanged, memoCache;

  const handleChange =
    memoCache[0] ||
    (memoCache[0] = todo => setTodos(todos => getUpdated(todos, todo)));
  
  let filtered;
  if (hasVisibilityChanged || hasTodosChanged) {
    filtered = (memoCache[1] = getFiltered(todos, visibility));
  } else {
    filtered = memoCache[1]
  }

  const jsx_addTodo = hasThemeColorChanged
    ? (memoCache[3] = <AddTodo setTodos={setTodos} themeColor={themeColor} />)
    : memoCache[3];

  return (
    <div>
      <ul>
        {filtered.map(todo => (
          <Todo key={todo.id} todo={todo} onChange={handleChange} />
        ))}
      </ul>
      {jsx_addTodo}
    </div>
  );
}

function TodoList3({ visibility, themeColor }) {
  const [todos, setTodos] = useState(initialTodos);

  let hasVisibilityChanged, hasThemeColorChanged, hasTodosChanged, memoCache;

  const handleChange =
    memoCache[0] ||
    (memoCache[0] = todo => setTodos(todos => getUpdated(todos, todo)));

  let filtered, jsx_todos;
  if (hasVisibilityChanged || hasTodosChanged) {
    filtered = memoCache[1] = getFiltered(todos, visibility);
    jsx_todos = memoCache[2] = (
      <ul>
        {filtered.map(todo => (
          <Todo key={todo.id} todo={todo} onChange={handleChange} />
        ))}
      </ul>
    );
  } else {
    filtered = memoCache[1];
    jsx_todos = memoCache[2];
  }

  const jsx_addTodo = hasThemeColorChanged
    ? (memoCache[3] = <AddTodo setTodos={setTodos} themeColor={themeColor} />)
    : memoCache[3];

  return (memoCache[4] = <div>{jsx_todos}{jsx_addTodo}</div>);
}

// Final
function TodoList({ visibility, themeColor }) {
  const [todos, setTodos] = useState(initialTodos);

  let hasVisibilityChanged, hasThemeColorChanged, hasTodosChanged, memoCache;

  if (hasVisibilityChanged || hasThemeColorChanged || hasTodosChanged) {
    const handleChange =
      memoCache[0] ||
      (memoCache[0] = todo => setTodos(todos => getUpdated(todos, todo)));

    let filtered, jsx_todos;
    if (hasVisibilityChanged || hasTodosChanged) {
      filtered = memoCache[1] = getFiltered(todos, visibility);
      jsx_todos = memoCache[2] = (<ul>{filtered.map(…)}</ul>);
      jsx_todos = memoCache[2] = (
        <ul>
          {filtered.map(todo => (
            <Todo key={todo.id} todo={todo} onChange={handleChange} />
          ))}
        </ul>
      );
    } else {
      filtered = memoCache[1];
      jsx_todos = memoCache[2];
    }

    const jsx_addTodo = hasThemeColorChanged
      ? (memoCache[3] = <AddTodo setTodos={setTodos} themeColor={themeColor} />)
      : memoCache[3];

    return (memoCache[4] = <div>{jsx_todos}{jsx_addTodo}</div>);
  } else {
    return memoCache[4];
  }
}

// Final (Tenary)
function TodoList3({ visibility, themeColor }) {
  const [todos, setTodos] = useState(initialTodos);

  let hasVisibilityChanged, hasThemeColorChanged, hasTodosChanged, memoCache;

  if (hasVisibilityChanged || hasThemeColorChanged || hasTodosChanged) {
    const handleChange =
      memoCache[0] ||
      (memoCache[0] = todo => setTodos(todos => getUpdated(todos, todo)));
    const filtered =
      hasVisibilityChanged || hasTodosChanged
        ? (memoCache[1] = getFiltered(todos, visibility))
        : memoCache[1];
    const jsx_todos =
      hasVisibilityChanged || hasTodosChanged
        ? (memoCache[2] = filtered.map(todo => (
            <Todo key={todo.id} todo={todo} onChange={handleChange} />
          )))
        : memoCache[2];
    const jsx_addTodo = hasThemeColorChanged
      ? (memoCache[4] = <AddTodo setTodos={setTodos} themeColor={themeColor} />)
      : memoCache[4];
    return (
      <div>
        <ul>{jsx_todos}</ul>
        {jsx_addTodo}
      </div>
    );
  }
}
