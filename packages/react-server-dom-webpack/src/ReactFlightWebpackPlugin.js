/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {join} from 'path';
import {pathToFileURL} from 'url';

import asyncLib from 'neo-async';

import ModuleDependency from 'webpack/lib/dependencies/ModuleDependency';
import NullDependency from 'webpack/lib/dependencies/NullDependency';
import Template from 'webpack/lib/Template';
import {
  sources,
  WebpackError,
  Compilation,
  AsyncDependenciesBlock,
} from 'webpack';

import isArray from 'shared/isArray';

class ClientReferenceDependency extends ModuleDependency {
  constructor(request) {
    super(request);
  }

  get type() {
    return 'client-reference';
  }
}

// This is the module that will be used to anchor all client references to.
// I.e. it will have all the client files as async deps from this point on.
// We use the Flight client implementation because you can't get to these
// without the client runtime so it's the first time in the loading sequence
// you might want them.
const clientImportName = 'react-server-dom-webpack';
const clientFileName = require.resolve('../');

type ClientReferenceSearchPath = {
  directory: string,
  recursive?: boolean,
  include: RegExp,
  exclude?: RegExp,
};

type ClientReferencePath = string | ClientReferenceSearchPath;

type Options = {
  isServer: boolean,
  clientReferences?: ClientReferencePath | $ReadOnlyArray<ClientReferencePath>,
  chunkName?: string,
  manifestFilename?: string,
};

const PLUGIN_NAME = 'React Server Plugin';

export default class ReactFlightWebpackPlugin {
  clientReferences: $ReadOnlyArray<ClientReferencePath>;
  chunkName: string;
  manifestFilename: string;

  constructor(options: Options) {
    if (!options || typeof options.isServer !== 'boolean') {
      throw new Error(
        PLUGIN_NAME + ': You must specify the isServer option as a boolean.',
      );
    }
    if (options.isServer) {
      throw new Error('TODO: Implement the server compiler.');
    }
    if (!options.clientReferences) {
      this.clientReferences = [
        {
          directory: '.',
          recursive: true,
          include: /\.client\.(js|ts|jsx|tsx)$/,
        },
      ];
    } else if (
      typeof options.clientReferences === 'string' ||
      !isArray(options.clientReferences)
    ) {
      this.clientReferences = [(options.clientReferences: $FlowFixMe)];
    } else {
      this.clientReferences = options.clientReferences;
    }
    if (typeof options.chunkName === 'string') {
      this.chunkName = options.chunkName;
      if (!/\[(index|request)\]/.test(this.chunkName)) {
        this.chunkName += '[index]';
      }
    } else {
      this.chunkName = 'client[index]';
    }
    this.manifestFilename =
      options.manifestFilename || 'react-client-manifest.json';
  }

  apply(compiler: any) {
    const _this = this;
    let resolvedClientReferences;
    let clientFileNameFound = false;

    // Find all client files on the file system
    compiler.hooks.beforeCompile.tapAsync(
      PLUGIN_NAME,
      ({contextModuleFactory}, callback) => {
        const contextResolver = compiler.resolverFactory.get('context', {});

        _this.resolveAllClientFiles(
          compiler.context,
          contextResolver,
          compiler.inputFileSystem,
          contextModuleFactory,
          function(err, resolvedClientRefs) {
            if (err) {
              callback(err);
              return;
            }

            resolvedClientReferences = resolvedClientRefs;
            callback();
          },
        );
      },
    );

    compiler.hooks.thisCompilation.tap(
      PLUGIN_NAME,
      (compilation, {normalModuleFactory}) => {
        compilation.dependencyFactories.set(
          ClientReferenceDependency,
          normalModuleFactory,
        );
        compilation.dependencyTemplates.set(
          ClientReferenceDependency,
          new NullDependency.Template(),
        );

        const handler = parser => {
          // We need to add all client references as dependency of something in the graph so
          // Webpack knows which entries need to know about the relevant chunks and include the
          // map in their runtime. The things that actually resolves the dependency is the Flight
          // client runtime. So we add them as a dependency of the Flight client runtime.
          // Anything that imports the runtime will be made aware of these chunks.
          parser.hooks.program.tap(PLUGIN_NAME, () => {
            const module = parser.state.module;

            if (module.resource !== clientFileName) {
              return;
            }

            clientFileNameFound = true;

            if (resolvedClientReferences) {
              for (let i = 0; i < resolvedClientReferences.length; i++) {
                const dep = resolvedClientReferences[i];

                const chunkName = _this.chunkName
                  .replace(/\[index\]/g, '' + i)
                  .replace(/\[request\]/g, Template.toPath(dep.userRequest));

                const block = new AsyncDependenciesBlock(
                  {
                    name: chunkName,
                  },
                  null,
                  dep.request,
                );

                block.addDependency(dep);
                module.addBlock(block);
              }
            }
          });
        };

        normalModuleFactory.hooks.parser
          .for('javascript/auto')
          .tap('HarmonyModulesPlugin', handler);

        normalModuleFactory.hooks.parser
          .for('javascript/esm')
          .tap('HarmonyModulesPlugin', handler);

        normalModuleFactory.hooks.parser
          .for('javascript/dynamic')
          .tap('HarmonyModulesPlugin', handler);
      },
    );

    compiler.hooks.make.tap(PLUGIN_NAME, compilation => {
      compilation.hooks.processAssets.tap(
        {
          name: PLUGIN_NAME,
          stage: Compilation.PROCESS_ASSETS_STAGE_REPORT,
        },
        function() {
          if (clientFileNameFound === false) {
            compilation.warnings.push(
              new WebpackError(
                `Client runtime at ${clientImportName} was not found. React Server Components module map file ${_this.manifestFilename} was not created.`,
              ),
            );
            return;
          }

          const json = {};
          compilation.chunkGroups.forEach(function(chunkGroup) {
            const chunkIds = chunkGroup.chunks.map(function(c) {
              return c.id;
            });

            function recordModule(id, module) {
              // TODO: Hook into deps instead of the target module.
              // That way we know by the type of dep whether to include.
              // It also resolves conflicts when the same module is in multiple chunks.

              if (!/\.client\.(js|ts)x?$/.test(module.resource)) {
                return;
              }

              const moduleProvidedExports = compilation.moduleGraph
                .getExportsInfo(module)
                .getProvidedExports();

              const moduleExports = {};
              ['', '*']
                .concat(
                  Array.isArray(moduleProvidedExports)
                    ? moduleProvidedExports
                    : [],
                )
                .forEach(function(name) {
                  moduleExports[name] = {
                    id,
                    chunks: chunkIds,
                    name: name,
                  };
                });
              const href = pathToFileURL(module.resource).href;

              if (href !== undefined) {
                json[href] = moduleExports;
              }
            }

            chunkGroup.chunks.forEach(function(chunk) {
              const chunkModules = compilation.chunkGraph.getChunkModulesIterable(
                chunk,
              );

              Array.from(chunkModules).forEach(function(module) {
                const moduleId = compilation.chunkGraph.getModuleId(module);

                recordModule(moduleId, module);
                // If this is a concatenation, register each child to the parent ID.
                if (module.modules) {
                  module.modules.forEach(concatenatedMod => {
                    recordModule(moduleId, concatenatedMod);
                  });
                }
              });
            });
          });

          const output = JSON.stringify(json, null, 2);
          compilation.emitAsset(
            _this.manifestFilename,
            new sources.RawSource(output, false),
          );
        },
      );
    });
  }

  // This attempts to replicate the dynamic file path resolution used for other wildcard
  // resolution in Webpack is using.
  resolveAllClientFiles(
    context: string,
    contextResolver: any,
    fs: any,
    contextModuleFactory: any,
    callback: (
      err: null | Error,
      result?: $ReadOnlyArray<ClientReferenceDependency>,
    ) => void,
  ) {
    asyncLib.map(
      this.clientReferences,
      (
        clientReferencePath: string | ClientReferenceSearchPath,
        cb: (
          err: null | Error,
          result?: $ReadOnlyArray<ClientReferenceDependency>,
        ) => void,
      ): void => {
        if (typeof clientReferencePath === 'string') {
          cb(null, [new ClientReferenceDependency(clientReferencePath)]);
          return;
        }
        const clientReferenceSearch: ClientReferenceSearchPath = clientReferencePath;
        contextResolver.resolve(
          {},
          context,
          clientReferencePath.directory,
          {},
          (err, resolvedDirectory) => {
            if (err) return cb(err);
            const options = {
              resource: resolvedDirectory,
              resourceQuery: '',
              recursive:
                clientReferenceSearch.recursive === undefined
                  ? true
                  : clientReferenceSearch.recursive,
              regExp: clientReferenceSearch.include,
              include: undefined,
              exclude: clientReferenceSearch.exclude,
            };
            contextModuleFactory.resolveDependencies(
              fs,
              options,
              (err2: null | Error, deps: Array<ModuleDependency>) => {
                if (err2) return cb(err2);
                const clientRefDeps = deps.map(dep => {
                  // use userRequest instead of request. request always end with undefined which is wrong
                  const request = join(resolvedDirectory, dep.userRequest);
                  const clientRefDep = new ClientReferenceDependency(request);
                  clientRefDep.userRequest = dep.userRequest;
                  return clientRefDep;
                });
                cb(null, clientRefDeps);
              },
            );
          },
        );
      },
      (
        err: null | Error,
        result: $ReadOnlyArray<$ReadOnlyArray<ClientReferenceDependency>>,
      ): void => {
        if (err) return callback(err);
        const flat = [];
        for (let i = 0; i < result.length; i++) {
          flat.push.apply(flat, result[i]);
        }
        callback(null, flat);
      },
    );
  }
}
