import { IApi } from '@umijs/preset-umi';
import { logger } from '@umijs/utils';

const toRemoveMethods = [
  'addExtraBabelPresets',
  'addExtraBabelPlugins',
  'addBeforeBabelPresets',
  'addBeforeBabelPlugins',
  // 仅ssr和webpack插件用到
  'modifyWebpackConfig',
  // 仅vite用到
  'modifyViteConfig',
  // 仅ssr用到
  'modifyServerRendererPath',
  // 用不到babel
  'modifyBabelPresetOpts',
];

export default (api: IApi) => {
  // 添加和修改Rsbuild的plugin
  ['modifyRsbuildPlugins', 'modifyRsbuildConfig'].forEach(name => {
    api.registerMethod({ name });
  });
  toRemoveMethods.forEach(v => {
    delete api.service.pluginMethods[v];
    api.registerMethod({
      name: v,
      fn() {
        logger.error(`不支持本方法:${v}`);
        throw new Error(`不支持本方法:${v}`);
      },
    });
  });
};
