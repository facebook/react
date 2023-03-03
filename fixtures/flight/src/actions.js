'use server';

export async function like() {
  return new Promise((resolve, reject) =>
    setTimeout(
      () =>
        Math.random() > 0.5
          ? resolve('Liked')
          : reject(new Error('Failed to like')),
      500
    )
  );
}
