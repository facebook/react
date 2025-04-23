const fs = require('fs/promises');
const path = require('path');

async function main() {
  const projectDir = path.resolve(__dirname, '..');
  const craBuildDir = path.join(projectDir, 'build');

  const buildOutputDir = path.join(projectDir, '.vercel/output');
  const buildStaticOutputDir = path.join(buildOutputDir, 'static');
  const buildFunctionsOutputDir = path.join(buildOutputDir, 'functions');

  await fs.rm(buildOutputDir, {recursive: true, force: true});
  await fs.mkdir(buildOutputDir, {recursive: true});

  await fs.cp(path.join(craBuildDir, 'static'), buildStaticOutputDir, {
    recursive: true,
  });

  const indexFunctionDir = path.join(buildFunctionsOutputDir, 'index.func');
  await fs.mkdir(indexFunctionDir, {recursive: true});
  const indexFunctionConfig = {
    runtime: 'Nodejs',
    handler: 'server/index.js',
  };
  await fs.writeFile(
    path.join(indexFunctionDir, '.vc-config.json'),
    JSON.stringify(indexFunctionConfig, null, 2)
  );
  await fs.cp(
    path.join(projectDir, 'node_modules'),
    path.join(indexFunctionDir, 'node_modules'),
    {
      recursive: true,
    }
  );
  await fs.cp(
    path.join(projectDir, 'server'),
    path.join(indexFunctionDir, 'server'),
    {
      recursive: true,
    }
  );
  await fs.cp(
    path.join(projectDir, 'src'),
    path.join(indexFunctionDir, 'src'),
    {
      recursive: true,
    }
  );

  const buildOutputConfig = {
    version: 3,
  };
  await fs.writeFile(
    path.join(buildOutputDir, 'config.json'),
    JSON.stringify(buildOutputConfig, null, 2)
  );
}

main();
