'use server';

import fs from 'fs/promises';

// Get current user ID from environment
function getCurrentUserId(): string {
  // In a real app, this would come from authentication context
  // For now, we use a simple identifier that should be set per request
  return process.env.CURRENT_USER_ID || 'anonymous';
}

// Check if the current user owns the todo
function isOwner(todo: Todo): boolean {
  const currentUserId = getCurrentUserId();
  return !todo.userId || todo.userId === currentUserId;
}

export interface Todo {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  isComplete: boolean;
  userId?: string; // Added for authorization
}

export async function getTodos(): Promise<Todo[]> {
  try {
    let contents = await fs.readFile('todos.json', 'utf8');
    let todos = JSON.parse(contents);
    // Filter todos to only return ones owned by the current user
    const currentUserId = getCurrentUserId();
    return todos.filter((todo: Todo) => !todo.userId || todo.userId === currentUserId);
  } catch {
    await fs.writeFile('todos.json', '[]');
    return [];
  }
}

export async function getTodo(id: number): Promise<Todo | undefined> {
  let todos = await getTodos();
  let todo = todos.find(todo => todo.id === id);
  // Only return todo if the current user owns it
  if (todo && isOwner(todo)) {
    return todo;
  }
  return undefined;
}

export async function createTodo(formData: FormData) {
  let todos = await getTodos();
  let title = formData.get('title');
  let description = formData.get('description');
  let dueDate = formData.get('dueDate');
  let id = todos.length > 0 ? Math.max(...todos.map(todo => todo.id)) + 1 : 0;
  todos.push({
    id,
    title: typeof title === 'string' ? title : '',
    description: typeof description === 'string' ? description : '',
    dueDate: typeof dueDate === 'string' ? dueDate : new Date().toISOString(),
    isComplete: false,
    userId: getCurrentUserId(), // Track ownership at creation
  });
  await fs.writeFile('todos.json', JSON.stringify(todos));
}

export async function updateTodo(id: number, formData: FormData) {
  let todos = await getTodos();
  let title = formData.get('title');
  let description = formData.get('description');
  let dueDate = formData.get('dueDate');
  let todo = todos.find(todo => todo.id === id);
  if (todo && isOwner(todo)) {
    todo.title = typeof title === 'string' ? title : '';
    todo.description = typeof description === 'string' ? description : '';
    todo.dueDate =
      typeof dueDate === 'string' ? dueDate : new Date().toISOString();
    await fs.writeFile('todos.json', JSON.stringify(todos));
  }
}

export async function setTodoComplete(id: number, isComplete: boolean) {
  let todos = await getTodos();
  let todo = todos.find(todo => todo.id === id);
  if (todo && isOwner(todo)) {
    todo.isComplete = isComplete;
    await fs.writeFile('todos.json', JSON.stringify(todos));
  }
}

export async function deleteTodo(id: number) {
  let todos = await getTodos();
  let index = todos.findIndex(todo => todo.id === id);
  if (index >= 0 && isOwner(todos[index])) {
    todos.splice(index, 1);
    await fs.writeFile('todos.json', JSON.stringify(todos));
  }
}
