import {
  PerformanceConfig,
  RspackChain,
  HtmlConfig,
  OutputConfig,
  SourceConfig,
  ToolsConfig,
  ServerConfig,
  DevConfig,
  RsbuildPlugins,
  rspack,
  ModifyBundlerChainUtils,
  RsbuildConfig,
  HtmlTagDescriptor,
  ModuleFederationConfig,
} from '@rsbuild/core';
import type { PluginSassOptions } from '@rsbuild/plugin-sass';
import type {
  MaybePromise,
  Stats,
  MetaOptions,
  RspackConfig,
  MultiStats,
} from '@rsbuild/core/dist-types/types';
import type { PluginTypeCheckerOptions } from '@rsbuild/plugin-type-check';
import type { PluginStylusOptions } from '@rsbuild/plugin-stylus';
import type { PluginLessOptions } from '@rsbuild/plugin-less';
import type { PluginReactOptions } from '@rsbuild/plugin-react';
import type { PluginSvgrOptions } from '@rsbuild/plugin-svgr';
import { Express, RequestHandler } from '@umijs/bundler-utils/compiled/express';
// import type { PostCSSPlugin } from '@rsbuild/core/dist-types/types/thirdParty';
import { Env } from '@umijs/core';

export type { MetaOptions } from '@rsbuild/core/dist-types/types';

export declare type IScript =
  | Partial<{
      async: boolean;
      charset: string;
      content: string;
      crossOrigin: string | null;
      defer: boolean;
      src: string;
      type: string;
    }>
  | string;
export declare type IStyle =
  | Partial<{
      content: string;
      src: string;
      type: string;
    }>
  | string;
export declare type ILink = Partial<{
  as: string;
  crossOrigin: string | null;
  disabled: boolean;
  href: string;
  hreflang: string;
  imageSizes: string;
  imageSrcset: string;
  integrity: string;
  media: string;
  referrerPolicy: string;
  rel: string;
  rev: string;
  target: string;
  type: string;
}>;
export declare type IMeta = Partial<{
  content: string;
  'http-equiv': string;
  name: string;
  scheme: string;
}>;

export type HTMLTag = HtmlTagDescriptor;

export interface IRoute {
  component: string;
  layout?: boolean;
  path: string;
  redirect?: string;
  routes?: IRoute[];
  wrappers?: string[];
}

export interface RUMIConfig {
  /**
   * 完整的rsbuild config，可用于覆盖其他配置，优先级高于其他配置
   */
  rsbuildConfig?: RsbuildConfig;
  analyze?: PerformanceConfig['bundleAnalyze'];
  /**
   * 路径别名
   */
  alias?: SourceConfig['alias'];
  aliasStrategy?: SourceConfig['aliasStrategy'];
  // 是否自动处理css modules，在import时如果有?modules则应用cssModules规则
  autoCSSModules?: boolean;
  // 废弃，改用.browserlistrc
  // autoprefixer?: Record<string, any>;
  /**
   * 路由基础路径
   */
  base?: string;
  /**
   * 修改bundler配置
   * @param chain
   * @param args
   */
  chainWebpack?: (
    chain: RspackChain,
    args: ModifyBundlerChainUtils,
  ) => MaybePromise<void>;
  copy?: OutputConfig['copy'];
  // 融合umi的cssLoader
  cssLoader?: ToolsConfig['cssLoader'];
  // 配置 css modules 的行为，详见 css-loader > modules;
  cssLoaderModules?: OutputConfig['cssModules'];
  conventionLayout?: boolean;
  conventionRoutes?: {
    base?: string;
    exclude?: RegExp[];
  };
  // rsbuild使用lightningcss，即通过配置中minify来配置
  // cssMinifier;
  crossorigin?: HtmlConfig['crossorigin'];
  // 不支持
  // classPropertiesLoose
  // 不支持
  // deadCode
  define?: SourceConfig['define'];
  // 用于指定使用esbuild等工具处理node_modules中符合条件的代码，实际上@umijs/bundler-webpack没用到
  // depTranspiler?: 'none';
  devtool?: RspackConfig['devtool'];
  // 不支持
  // esbuildMinifyIIFE
  // 新增
  exclude?: SourceConfig['exclude'];
  externals?: OutputConfig['externals'];
  // 不支持，改为extraIncludes
  // extraBabelIncludes
  // 对标umi的extraBabelIncludes
  extraIncludes?: SourceConfig['include'];
  // 不支持，改为swcLoader
  // extraBabelPlugins
  // 不支持，改为swcLoader
  // extraBabelPresets
  // 建议使用function形式，参考https://rsbuild.dev/zh/config/tools/swc
  swcLoader?: ToolsConfig['swc'];
  // 多用于静态站点，暂不支持；umi通过插件进行支持
  // exportStatic
  // 不支持，改为使用postcssLoader配置
  // extraPostCSSPlugins: PostCSSPlugin[];
  favicons?: HtmlConfig['favicon'];
  // 不支持
  // forget
  // 交由插件@rsbuild/plugin-type-check实现，配置有变更
  forkTSChecker?: PluginTypeCheckerOptions['forkTsCheckerOptions'];
  // 默认为true，设置为contenthash:8
  hash?: OutputConfig['filenameHash'];
  headScripts?: Array<IScript>;
  https?: ServerConfig['https'];
  history?: {
    type?: 'browser' | 'memory' | 'hash';
  };
  historyWithQuery?: boolean;
  ignoreMomentLocale?: PerformanceConfig['removeMomentLocale'];
  inlineLimit?: OutputConfig['dataUriLimit']; // 默认4096
  // 这两个，不支持，仅支持rsbuild使用swc压缩js，lightningcss压缩css
  // jsMinifier?: string;
  // jsMinifierOptions?: Record<string, never>;
  minify?: OutputConfig['minify'];
  links?: Array<IStyle>;
  // 不支持
  // legacy
  // less-loader通过@rsbuild/plugin-less解决
  lessLoader?: PluginLessOptions['lessLoaderOptions'] | boolean;
  metas?: Array<{ name: string; content: string }>;
  mountElementId?: string;
  manifest?: OutputConfig['manifest'];
  // 不支持
  // mdx
  // 不支持mfsu，改为rsbuild的mfsu
  moduleFederation?: ModuleFederationConfig['options'];
  outputPath?: string;
  // pnpm不需要。其他的可以通过eslint规则来实现
  // phantomDependency
  // 插件名称声明
  plugins?: string[];
  npmClient?: 'yarn' | 'pnpm' | 'npm';
  polyfill?: OutputConfig['polyfill'];
  // 不需要，实际上完全可以通过postcss.config.js来实现
  postcssLoader?: ToolsConfig['postcss'];
  // 插件集合名称声明
  presets?: string[];
  proxy?: ServerConfig['proxy'];
  publicPath?: OutputConfig['assetPrefix'];
  // 不支持
  // runtimePublicPath
  scripts?: Array<IScript>;
  sassLoader?: PluginSassOptions['sassLoaderOptions'];
  styleLoader?: ToolsConfig['styleLoader'];
  stylusLoader?: PluginStylusOptions['stylusOptions'];
  styles?: Array<IStyle>;
  // 不支持，默认swc
  // srcTranspiler
  // 不支持
  // srcTranspilerOptions
  // 使用svgr插件
  svgr?: PluginSvgrOptions;
  targets?: Record<string, string | number>;
  theme?: Record<string, string>;
  title?: HtmlConfig['title'];
  writeToDisk?: DevConfig['writeToDisk'];
  routeLoader?: {
    moduleType?: 'esm' | 'cjs';
  };
  reactRouter5Compat?: boolean;
  routes?: IRoute[];
  transformImport?: SourceConfig['transformImport'];
  react?: PluginReactOptions | boolean;
  rspack?: ToolsConfig['rspack'];
}

export interface RsbuildBundlerConfig {
  watch?: boolean;
  env: Env;
  react?: {
    runtime?: 'automatic' | 'classic';
  };
  config: RUMIConfig;
  pkg: {
    name?: string;
    version?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  cwd: string;
  rootDir: string;
  analyze?: string;
  entry: Record<string, string>;
  port?: string;
  host?: string;
  ip?: string;
  tags?: HtmlConfig['tags'];
  metas?: MetaOptions;
  chainWebpack?: (
    chain: RspackChain,
    args: ModifyBundlerChainUtils,
  ) => MaybePromise<void>;
  modifyRsbuildConfig?: (
    config: RsbuildConfig,
    args: { env: Env; rspack: typeof rspack },
  ) => Promise<RsbuildConfig>;
  modifyRsbuildPlugins?: (
    config: RsbuildPlugins,
    args: { env: Env; rspack: typeof rspack },
  ) => Promise<RsbuildPlugins>;
  beforeMiddlewares?: RequestHandler[];
  afterMiddlewares?: RequestHandler[];
  onDevCompileDone?: (opts: {
    isFirstCompile: boolean;
    stats?: Stats | MultiStats;
    time?: number;
  }) => MaybePromise<void>;
  onProgress?: (opts: {
    progresses: Array<{
      percent: number;
      status: string;
      details: string[];
    }>;
  }) => MaybePromise<void>;
  onBeforeMiddleware?: (app: Express) => MaybePromise<void>;
  onBuildComplete?: (opts: {
    err?: Error;
    stats?: Stats | MultiStats;
    isFirstCompile: boolean;
    time?: number;
  }) => Promise<void>;
}
