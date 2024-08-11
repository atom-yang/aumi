import { RsbuildBundlerConfig, build } from '@aumi/bundler-rsbuild';
import { commonBuildPhase, generateFile } from './utils';
import { IApi } from '@/types';

export default (api: IApi) => {
  api.registerCommand({
    name: 'build',
    description: 'build app for production',
    fn: async () => {
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
        analyze: process.env.ANALYZE,
        async onBuildComplete(opts) {
          await api.applyPlugins({
            key: 'onBuildComplete',
            args: opts,
          });
        },
      };

      await api.applyPlugins({
        key: 'onBeforeCompiler',
        args: { compiler: 'rsbuild', opts: rsbuildBundlerConfig },
      });

      await build(rsbuildBundlerConfig);
    },
  });
};
