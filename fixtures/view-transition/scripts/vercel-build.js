const childProcess = require('child_process');
const fs = require('fs/promises');
const path = require('path');

/**
 * vite-plugin-ssr for create-react-app
 */
async function main() {
  const projectDir = path.resolve(__dirname, '..');
  const craBuildDir = path.join(projectDir, 'build');

  const buildOutputDir = path.join(projectDir, '.vercel/output');
  const buildStaticOutputDir = path.join(buildOutputDir, 'static');
  const buildFunctionsOutputDir = path.join(buildOutputDir, 'functions');

  childProcess.execSync('yarn build', {stdio: 'inherit'});
  // reduce amount of n_m shipped
  childProcess.execSync('yarn install --production', {stdio: 'inherit'});

  await fs.rm(buildOutputDir, {recursive: true, force: true});
  await fs.mkdir(buildOutputDir, {recursive: true});

  await fs.cp(
    path.join(craBuildDir, 'static'),
    path.join(buildStaticOutputDir, 'static'),
    {
      recursive: true,
    }
  );

  const indexFunctionDir = path.join(buildFunctionsOutputDir, 'index.func');
  await fs.mkdir(indexFunctionDir, {recursive: true});
  const indexFunctionConfig = {
    handler: 'server/index.js',
    launcherType: 'Nodejs',
    runtime: 'nodejs22.x',
    environment: {},
  };
  await fs.writeFile(
    path.join(indexFunctionDir, '.vc-config.json'),
    JSON.stringify(indexFunctionConfig, null, 2)
  );
  await fs.cp(
    path.join(projectDir, 'package.json'),
    path.join(indexFunctionDir, 'package.json'),
    {
      recursive: true,
    }
  );
  await fs.cp(
    path.join(projectDir, 'build'),
    path.join(indexFunctionDir, 'build'),
    {
      recursive: true,
    }
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
