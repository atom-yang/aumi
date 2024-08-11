import { dirname, join } from 'path';
import { resolve } from '@umijs/utils';
import { RUMIConfig } from '@rumi/bundler-rsbuild';
import type { IApi } from '@/types';

function resolveProjectDep(opts: {
  pkg: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  cwd: string;
  dep: string;
}) {
  if (
    opts.pkg?.dependencies?.[opts.dep] ||
    opts.pkg?.devDependencies?.[opts.dep]
  ) {
    return dirname(
      resolve.sync(`${opts.dep}/package.json`, {
        basedir: opts.cwd,
      }),
    );
  }
  return undefined;
}

const InnerConfigList = [
  // rumi新增的
  'rsbuildConfig',
  'rspack',
  'react',
  'transformImport',
  'cssModules',
  'crossorigin',
  'exclude',
  'extraIncludes',
  'swcLoader',
  'favicons',
  'minify',
  'polyfill',
  'moduleFederation',
  'aliasStrategy',
  // umi自带的
  'alias',
  'autoCSSModules',
  // 'autoprefixer',
  'babelLoaderCustomize',
  'cacheDirectoryPath',
  'chainWebpack',
  'checkDepCssModules',
  'copy',
  'cssLoader',
  'cssLoaderModules',
  'cssMinifier',
  'cssMinifierOptions',
  'cssPublicPath',
  'deadCode',
  'define',
  'depTranspiler',
  'devtool',
  'esm',
  'externals',
  'extraBabelIncludes',
  'extraBabelPlugins',
  'extraBabelPresets',
  'extraPostCSSPlugins',
  'fastRefresh',
  'forkTSChecker',
  'hash',
  'https',
  'ignoreMomentLocale',
  'inlineLimit',
  'jsMinifier',
  'jsMinifierOptions',
  'lessLoader',
  'manifest',
  'mdx',
  'mfsu',
  'normalCSSLoaderModules',
  'outputPath',
  'postcssLoader',
  'proxy',
  'publicPath',
  'purgeCSS',
  'runtimePublicPath',
  'sassLoader',
  'srcTranspiler',
  'srcTranspilerOptions',
  'styleLoader',
  'stylusLoader',
  'svgo',
  'svgr',
  'targets',
  'theme',
  'writeToDisk',
  'analyze',
  'base',
  'conventionLayout',
  'conventionRoutes',
  'esbuildMinifyIIFE',
  'headScripts',
  'history',
  'historyWithQuery',
  'links',
  'metas',
  'mountElementId',
  'npmClient',
  'plugins',
  'presets',
  'reactRouter5Compat',
  'routeLoader',
  'routes',
  'scripts',
  'styles',
  'title',
];

export default (api: IApi) => {
  const { userConfig } = api;
  const reactDOMPath =
    resolveProjectDep({
      pkg: api.pkg,
      cwd: api.cwd,
      dep: 'react-dom',
    }) || dirname(require.resolve('react-dom/package.json'));
  const isLT18 = (() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires,import/no-dynamic-require
    const reactDOMVersion = require(join(reactDOMPath, 'package.json')).version;
    const majorVersion = parseInt(reactDOMVersion.split('.')[0], 10);
    return majorVersion < 18;
  })();
  const configDefaults: Partial<RUMIConfig> = {
    alias: {
      umi: '@@/exports',
      react:
        resolveProjectDep({
          pkg: api.pkg,
          cwd: api.cwd,
          dep: 'react',
        }) || dirname(require.resolve('react/package.json')),
      ...(isLT18
        ? {
            'react-dom/client': reactDOMPath,
          }
        : {}),
      'react-dom': reactDOMPath,
      // mpa don't need to use react-router
      ...(userConfig.mpa
        ? {}
        : {
            'react-router': dirname(
              require.resolve('react-router/package.json'),
            ),
            'react-router-dom': dirname(
              require.resolve('react-router-dom/package.json'),
            ),
          }),
    },
    externals: {
      // Keep the `react-dom/client` external consistent with the `react-dom` external when react < 18.
      // Otherwise, `react-dom/client` will still bundled in the outputs.
      ...(isLT18 && userConfig.externals?.['react-dom']
        ? {
            'react-dom/client': userConfig.externals['react-dom'],
          }
        : {}),
    },
    publicPath: '/',
    mountElementId: 'root',
    base: '/',
    history: { type: 'browser' },
    svgr: {},
    ignoreMomentLocale: true,
    routeLoader: { moduleType: 'esm' },
  };
  for (const key of InnerConfigList) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: Record<string, any> = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      schema: (Joi: any) => Joi.any(),
    };
    if (key in configDefaults) {
      config.default = configDefaults[key as keyof RUMIConfig];
    }

    // when routes change, not need restart server
    // routes data will auto update in `onGenerateFiles` (../tmpFiles/tmpFiles.ts)
    if (['routes'].includes(key)) {
      config.onChange = api.ConfigChangeType.regenerateTmpFiles;
    }

    api.registerPlugins([
      {
        id: `virtual: config-${key}`,
        key,
        config,
      },
    ]);
  }

  // api.paths is ready after register
  api.modifyConfig((memo, args) => {
    memo.alias = {
      ...memo.alias,
      '@': args.paths.absSrcPath,
      '@@': args.paths.absTmpPath,
    };
    return memo;
  });
};
