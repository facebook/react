// @flow

export const readInputData = (file: File) => {
  if (!file.name.endsWith('.json')) {
    console.error(
      'Invalid file type, insert a captured performance profile JSON',
    );
    return;
  }
  // Initialize file reader
  const fileReader = new FileReader();

  return new Promise((resolve, reject) => {
    fileReader.onerror = () => {
      fileReader.abort();
      reject(new DOMException('Problem parsing input file.'));
    };

    fileReader.onload = () => {
      resolve(fileReader.result);
    };
    fileReader.readAsText(file);
  });
};
