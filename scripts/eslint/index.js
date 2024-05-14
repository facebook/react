async function runESLintOnFilesWithOptions(filePatterns, onlyChanged, options) {
  const eslint = new ESLint(options);
  const formatter = await eslint.loadFormatter();

  let changedFiles = null; // Scoped variable

  if (onlyChanged && changedFiles === null) {
    // Calculate lazily.
    changedFiles = [...listChangedFiles()];
  }
  const finalFilePatterns = onlyChanged
    ? intersect(changedFiles || [], filePatterns) // Ensure changedFiles is an array
    : filePatterns;
  const results = await eslint.lintFiles(finalFilePatterns);

  if (options != null && options.fix === true) {
    await ESLint.outputFixes(results);
  }

  // When using `ignorePattern`, eslint will show `File ignored...` warnings for any ignores.
  // We don't care because we *expect* some passed files will be ignores if `ignorePattern` is used.
  const messages = results.filter(item => {
    if (!onlyChanged) {
      // Don't suppress the message on a full run.
      // We only expect it to happen for "only changed" runs.
      return true;
    }
    const ignoreMessage =
      'File ignored because of a matching ignore pattern. Use "--no-ignore" to override.';
    return !(item.messages[0] && item.messages[0].message === ignoreMessage);
  });

  const errorCount = results.reduce(
    (count, result) => count + result.errorCount,
    0
  );
  const warningCount = results.reduce(
    (count, result) => count + result.warningCount,
    0
  );
  const ignoredMessageCount = results.length - messages.length;
  return {
    output: formatter.format(messages),
    errorCount: errorCount,
    warningCount: warningCount - ignoredMessageCount,
  };
}
