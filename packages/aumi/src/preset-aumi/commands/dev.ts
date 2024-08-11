import { basename, join } from 'path';
import { existsSync, readdirSync, readFileSync } from 'fs';
import {
  lodash,
  winPath,
  portfinder,
  address,
  logger,
  chalk,
  rimraf,
} from '@umijs/utils';
import { dev, RsbuildBundlerConfig } from '@aumi/bundler-rsbuild';
import {
  expandJSPaths,
  expandCSSPaths,
  watch,
  createDebouncedHandler,
  unwatch,
  addUnWatch,
} from '@umijs/preset-umi/dist/commands/dev/watch';
import { commonBuildPhase, generateFile } from './utils';
import { IApi } from '@/types';

export default (api: IApi) => {
  api.describe({
    enableBy() {
      return api.name === 'dev';
    },
  });
  api.registerCommand({
    name: 'dev',
    description: 'Start development mode and dev server',
    details: `
umi dev

# dev with specified port
PORT=8888 umi dev
`,
    async fn() {
      logger.info(chalk.cyan.bold(`Umi v${api.appData.umi.version}`));

      // clear tmp
      rimraf.sync(api.paths.absTmpPath);
      // check package.json
      await api.applyPlugins({
        key: 'onCheckPkgJSON',
        args: {
          origin: null,
          current: api.appData.pkg,
        },
      });

      const generate = await generateFile(api);
      await generate({
        isFirstTime: true,
      });

      const { absPagesPath, absSrcPath } = api.paths;
      const watcherPaths: string[] = await api.applyPlugins({
        key: 'addTmpGenerateWatcherPaths',
        initialValue: [
          absPagesPath,
          !api.config.routes && api.config.conventionRoutes?.base,
          join(absSrcPath, 'layouts'),
          ...expandJSPaths(join(absSrcPath, 'loading')),
          ...expandJSPaths(join(absSrcPath, 'app')),
          ...expandJSPaths(join(absSrcPath, 'global')),
          ...expandCSSPaths(join(absSrcPath, 'global')),
          ...expandCSSPaths(join(absSrcPath, 'overrides')),
        ].filter(Boolean),
      });
      // 更新临时文件
      lodash.uniq<string>(watcherPaths.map(winPath)).forEach((p: string) => {
        watch({
          path: p,
          addToUnWatches: true,
          onChange: createDebouncedHandler({
            timeout: 2000,
            async onChange(opts) {
              await generate({ files: opts.files, isFirstTime: false });
            },
          }),
        });
      });

      // watch package.json change
      const pkgPath = join(api.cwd, 'package.json');
      watch({
        path: pkgPath,
        addToUnWatches: true,
        onChange() {
          // Why try catch?
          // ref: https://github.com/umijs/umi/issues/8608
          try {
            const origin = api.appData.pkg;
            api.appData.pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
            api.applyPlugins({
              key: 'onCheckPkgJSON',
              args: {
                origin,
                current: api.appData.pkg,
              },
            });
            api.applyPlugins({
              key: 'onPkgJSONChanged',
              args: {
                origin,
                current: api.appData.pkg,
              },
            });
          } catch (e) {
            logger.error(e);
          }
        },
      });

      // watch config file change
      addUnWatch(
        api.service.configManager!.watch({
          schemas: api.service.configSchemas,
          onChangeTypes: api.service.configOnChanges,
          async onChange(opts) {
            await api.applyPlugins({
              key: 'onCheckConfig',
              args: {
                config: api.config,
                userConfig: api.userConfig,
              },
            });
            const { data } = opts;
            if (data.changes[api.ConfigChangeType.reload]) {
              logger.info(
                `config ${data.changes[api.ConfigChangeType.reload].join(
                  ', ',
                )} changed, restart server...`,
              );
              api.restartServer();
              return;
            }
            await api.service.resolveConfig();
            if (data.changes[api.ConfigChangeType.regenerateTmpFiles]) {
              logger.info(
                `config ${data.changes[
                  api.ConfigChangeType.regenerateTmpFiles
                ].join(', ')} changed, regenerate tmp files...`,
              );
              await generate({ isFirstTime: false });
            }
            for await (const fn of data.fns) {
              await fn();
            }
          },
        }),
      );

      // watch plugin change
      const pluginFiles: string[] = [
        join(api.cwd, 'plugin.ts'),
        join(api.cwd, 'plugin.js'),
      ];
      pluginFiles.forEach((filePath: string) => {
        watch({
          path: filePath,
          addToUnWatches: true,
          onChange() {
            logger.info(`${basename(filePath)} changed, restart server...`);
            api.restartServer();
          },
        });
      });

      // watch public dir change and restart server
      function watchPublicDirChange() {
        const publicDir = join(api.cwd, 'public');
        const isPublicAvailable =
          existsSync(publicDir) && readdirSync(publicDir).length;
        let restarted = false;
        const restartServer = () => {
          if (restarted) {
            return;
          }
          restarted = true;
          logger.event(`public dir changed, restart server...`);
          api.restartServer();
        };
        watch({
          path: publicDir,
          addToUnWatches: true,
          onChange(event, path) {
            if (isPublicAvailable) {
              // listen public dir delete event
              if (event === 'unlinkDir' && path === publicDir) {
                restartServer();
              } else if (
                // listen public files all deleted
                event === 'unlink' &&
                existsSync(publicDir) &&
                readdirSync(publicDir).length === 0
              ) {
                restartServer();
              }
            } else {
              // listen public dir add first file event
              // eslint-disable-next-line no-lonely-if
              if (
                event === 'add' &&
                existsSync(publicDir) &&
                readdirSync(publicDir).length === 1
              ) {
                restartServer();
              }
            }
          },
        });
      }
      watchPublicDirChange();

      // start dev server
      const beforeMiddlewares = await api.applyPlugins({
        key: 'addBeforeMiddlewares',
        initialValue: [],
      });
      const middlewares = await api.applyPlugins({
        key: 'addMiddlewares',
        initialValue: [],
      });

      const partialConfig = await commonBuildPhase(api);

      const rsbuildBundlerConfig: RsbuildBundlerConfig = {
        env: api.env,
        entry: partialConfig.entry!,
        ...partialConfig,
        config: {
          outputPath: api.userConfig.outputPath || 'dist',
          ...api.config,
        },
        pkg: api.pkg,
        cwd: api.cwd,
        rootDir: process.cwd(),
        port: api.appData.port,
        host: api.appData.host,
        ip: api.appData.ip,
        beforeMiddlewares,
        afterMiddlewares: middlewares,
        onDevCompileDone(opts) {
          api.appData.bundleStatus.done = true;
          api.applyPlugins({
            key: 'onDevCompileDone',
            args: opts,
          });
        },
        onProgress(opts) {
          api.appData.bundleStatus.progresses = opts.progresses;
        },
        onBeforeMiddleware(app) {
          api.applyPlugins({
            key: 'onBeforeMiddleware',
            args: {
              app,
            },
          });
        },
      };
      await dev(rsbuildBundlerConfig);
      await api.applyPlugins({
        key: 'onBeforeCompiler',
        args: { compiler: 'rsbuild' },
      });
    },
  });

  api.modifyAppData(async memo => {
    memo.port = await portfinder.getPortPromise({
      port: parseInt(String(process.env.PORT || 8000), 10),
    });
    memo.host = process.env.HOST || '0.0.0.0';
    memo.ip = address.ip();
    return memo;
  });

  api.registerMethod({
    name: 'restartServer',
    fn() {
      logger.info(`Restart dev server with port ${api.appData.port}...`);
      unwatch();

      process.send?.({
        type: 'RESTART',
        payload: {
          port: api.appData.port,
        },
      });
    },
  });
};
