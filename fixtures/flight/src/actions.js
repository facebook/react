'use server';

export async function like() {
  return new Promise((resolve, reject) => resolve('Liked'));
}

export async function greet(formData) {
  const name = formData.get('name') || 'you';
  const file = formData.get('file');
  if (file) {
    return `Ok, ${name}, here is ${file.name}:
      ${(await file.text()).toUpperCase()}
    `;
  }
  return 'Hi ' + name + '!';
}
