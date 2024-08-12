import {
  mergeRsbuildConfig,
  rspack,
  RsbuildConfig,
  RsbuildPlugins,
} from '@rsbuild/core';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTypeCheck } from '@rsbuild/plugin-type-check';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';
import { pluginStylus } from '@rsbuild/plugin-stylus';
import { pluginSvgr } from '@rsbuild/plugin-svgr';
import { pluginSass } from '@rsbuild/plugin-sass';
import { lodash, logger } from '@umijs/utils';
import { Env } from '@umijs/core';
import { RsbuildBundlerConfig } from '@/types';

const convertToBrowserList = (targets: Record<string, string | number>) => {
  return Object.entries(targets).map(([key, value]) => {
    return `${key} ${lodash.isNumber(value) ? `>=${value}` : value}`;
  });
};

export const convertBundlerConfigToRsbuildConfig = async (
  bundlerConfig: RsbuildBundlerConfig,
): Promise<RsbuildConfig> => {
  const {
    react,
    env,
    config,
    host,
    port,
    chainWebpack,
    modifyRsbuildConfig,
    entry,
    analyze,
    modifyRsbuildPlugins,
    tags = [],
    metas,
  } = bundlerConfig;
  const plugins: RsbuildPlugins = [];
  if (config?.lessLoader !== false) {
    logger.info(`启用Rsbuild插件plugin-less`);
    plugins.push(
      pluginLess({
        lessLoaderOptions(options) {
          if (lodash.isObject(config?.lessLoader ?? {})) {
            const lessLoaderOptions = (config?.lessLoader ?? {}) as Record<
              string,
              any
            >;
            return {
              ...options,
              ...lessLoaderOptions,
              lessOptions: {
                ...(options.lessOptions ?? {}),
                ...(lessLoaderOptions?.lessOptions ?? {}),
                modifyVars: {
                  ...(options.lessOptions?.modifyVars ?? {}),
                  ...(lessLoaderOptions?.lessOptions?.modifyVars ?? {}),
                  ...(config.theme ?? {}),
                },
              },
            };
          }
          return options;
        },
      }),
    );
  }
  if (config?.react !== false) {
    logger.info(`启用Rsbuild插件plugin-react`);
    const reactOptions = lodash.isObject(config?.react ?? {})
      ? (config.react as Record<string, any>)
      : {};
    plugins.push(
      pluginReact({
        ...(reactOptions ?? {}),
        swcReactOptions: {
          runtime: react?.runtime ?? 'automatic',
          ...(reactOptions?.swcReactOptions ?? {}),
        },
      }),
    );
  }
  if (config?.forkTSChecker) {
    logger.info(`启用Rsbuild插件plugin-type-check`);
    plugins.push(
      pluginTypeCheck({
        enable: true,
        forkTsCheckerOptions: config.forkTSChecker,
      }),
    );
  }
  if (config?.sassLoader) {
    logger.info(`启用Rsbuild插件plugin-saas`);
    plugins.push(
      pluginSass({
        sassLoaderOptions: config.sassLoader,
      }),
    );
  }
  if (config?.stylusLoader) {
    logger.info(`启用Rsbuild插件plugin-stylus`);
    plugins.push(
      pluginStylus({
        stylusOptions: config.stylusLoader,
      }),
    );
  }
  if (config?.svgr) {
    logger.info(`启用Rsbuild插件plugin-svgr`);
    plugins.push(pluginSvgr(config.svgr));
  }
  const define: Record<string, string> = {};
  if (config.define) {
    for (const [key, value] of Object.entries(config.define)) {
      define[key] = JSON.stringify(value);
    }
  }
  let rsbuildConfig: RsbuildConfig = {
    plugins:
      (await modifyRsbuildPlugins?.(plugins, { env, rspack })) ?? plugins,
    dev: {
      assetPrefix: '/',
      writeToDisk: config.writeToDisk,
      lazyCompilation: true,
      // setupMiddlewares: {}
    },
    source: {
      alias: config.alias,
      aliasStrategy: config.aliasStrategy ?? 'prefer-alias',
      define,
      entry,
      exclude: config.exclude,
      include: config.extraIncludes,
      transformImport: config.transformImport,
    },
    output: {
      cleanDistPath: true,
      manifest: config.manifest,
      assetPrefix: config.publicPath,
      charset: 'utf8',
      copy: config.copy,
      cssModules: {
        ...config.cssLoaderModules,
        auto: config.autoCSSModules
          ? () => true
          : config?.cssLoaderModules?.auto ?? true,
      },
      externals: config.externals,
      dataUriLimit: config.inlineLimit,
      polyfill: config.polyfill ?? 'usage',
      overrideBrowserslist: convertToBrowserList(
        config.targets ?? {
          chrome: 80,
        },
      ),
      filenameHash: config.hash,
      distPath: {
        root: config.outputPath,
      },
      sourceMap: {
        js:
          config?.devtool ??
          (env === Env.production
            ? // 生产环境使用高质量的 source map 格式
              'source-map'
            : // 开发环境使用性能更好的 source map 格式
              'cheap-module-source-map'),
        css: false,
      },
      minify: config.minify,
    },
    html: {
      crossorigin: config.crossorigin,
      favicon: config.favicons,
      title: config.title,
      mountId: config.mountElementId ?? 'root',
      tags,
      meta: metas,
    },
    server: {
      port: Number(port || 8000),
      host,
      open: true,
      https: config.https,
      proxy: config.proxy,
    },
    tools: {
      // autoprefixer: config.autoprefixer,
      bundlerChain: async (chain, args) => {
        await chainWebpack?.(chain, args);
        await config.chainWebpack?.(chain, args);
        if (process.env.RSDOCTOR?.toUpperCase() === 'TRUE') {
          chain.plugin('rs-doctor').use(RsdoctorRspackPlugin, [
            {
              features: ['loader', 'plugins', 'bundle', 'resolver'],
              supports: {
                banner: args.env === Env.development,
                parseBundle: true,
                generateTileGraph: true,
              },
            },
          ]);
        }
      },
      cssLoader: config.cssLoader,
      postcss: config.postcssLoader,
      swc: config.swcLoader,
      styleLoader: config.styleLoader,
      rspack: config.rspack,
    },
    performance: {
      bundleAnalyze: config.analyze || analyze ? {} : undefined,
      removeMomentLocale: config.ignoreMomentLocale,
    },
    moduleFederation: config.moduleFederation
      ? {
          options: config.moduleFederation,
        }
      : undefined,
  };
  rsbuildConfig =
    (await modifyRsbuildConfig?.(rsbuildConfig, {
      env,
      rspack,
    })) ?? rsbuildConfig;
  if (Object.keys(config.rsbuildConfig ?? {}).length > 0) {
    return mergeRsbuildConfig(rsbuildConfig, config.rsbuildConfig!);
  }
  return rsbuildConfig;
};
