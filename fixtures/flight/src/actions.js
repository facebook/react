'use server';

export async function like() {
  return new Promise((resolve, reject) => resolve('Liked'));
}

export async function greet(formData) {
  return 'Hi ' + formData.get('name') + '!';
}
