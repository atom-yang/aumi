import { join } from 'path';
import assert from 'assert';
import { GenerateFilesFn } from '@umijs/preset-umi/dist/types';
import { semver } from '@umijs/utils';
import {
  RsbuildBundlerConfig,
  IScript,
  IStyle,
  IMeta,
  ILink,
  HTMLTag,
  MetaOptions,
} from '@aumi/bundler-rsbuild';
import { IApi } from '@/types';

export async function generateFile(api: IApi) {
  // generate files
  const generate: GenerateFilesFn = async opts => {
    await api.applyPlugins({
      key: 'onGenerateFiles',
      args: {
        files: opts.files || null,
        isFirstTime: opts.isFirstTime,
      },
    });
  };
  return generate;
}

export async function commonBuildPhase(
  api: IApi,
): Promise<Partial<RsbuildBundlerConfig>> {
  const chainWebpack = createWebpackChain(api);

  const modifyRsbuildConfig = createModifyRsbuildConfig(api);

  const entry = await api.applyPlugins({
    key: 'modifyEntry',
    initialValue: {
      index: join(api.paths.absTmpPath, 'umi.ts'),
    },
  });

  const modifyRsbuildPlugins = createModifyRsbuildPlugins(api);

  const shouldUseAutomaticRuntime =
    api.appData.react?.version &&
    semver.gte(api.appData.react.version, '17.0.0');
  const tagsAndMetas = await getHTMLTagsAndMetas(api);
  return {
    ...tagsAndMetas,
    react: {
      runtime: shouldUseAutomaticRuntime ? 'automatic' : 'classic',
    },
    entry,
    chainWebpack,
    modifyRsbuildConfig,
    modifyRsbuildPlugins,
  };
}

export function createWebpackChain(
  api: IApi,
): RsbuildBundlerConfig['chainWebpack'] {
  return async function (chain, utils) {
    await api.applyPlugins({
      key: 'chainWebpack',
      type: api.ApplyPluginsType.modify,
      initialValue: chain,
      args: utils,
    });
  };
}

export function createModifyRsbuildConfig(
  api: IApi,
): RsbuildBundlerConfig['modifyRsbuildConfig'] {
  return async function (config, args) {
    return await api.applyPlugins({
      key: 'modifyRsbuildConfig',
      initialValue: config,
      args,
    });
  };
}

export function createModifyRsbuildPlugins(
  api: IApi,
): RsbuildBundlerConfig['modifyRsbuildPlugins'] {
  return async function (plugins, args) {
    return await api.applyPlugins({
      key: 'modifyRsbuildPlugins',
      initialValue: plugins,
      args,
    });
  };
}

export const getProfile = (
  a: string | boolean,
): 'ALL' | 'TRACE' | 'CPU' | 'LOGGING' | undefined => {
  if (a === true) {
    return 'ALL';
  }
  if (typeof a === 'string') {
    switch (a.toLowerCase()) {
      case 'ALL':
        return 'ALL';
      case 'TRACE':
        return 'TRACE';
      case 'CPU':
        return 'CPU';
      case 'LOGGING':
        return 'LOGGING';
      default:
        return undefined;
    }
  }
  return undefined;
};

export const getRsdoctor = (a: string | boolean): boolean => {
  return a === true || (a as string)?.toUpperCase?.() === 'TRUE';
};

const RE_URL = /^(http:|https:)?\/\//;

export function normalizeScript(script: IScript): Exclude<IScript, string> {
  if (typeof script === 'string') {
    const isUrl =
      RE_URL.test(script) ||
      (script.startsWith('/') && !script.startsWith('/*')) ||
      script.startsWith('./') ||
      script.startsWith('../');
    return isUrl
      ? {
          src: script,
        }
      : { content: script };
  } else if (typeof script === 'object') {
    assert(
      typeof script.src === 'string' || typeof script.content === 'string',
      `Script must have either a "src" or a "content" property.`,
    );
    return script;
  } else {
    throw new Error(`Invalid script type: ${typeof script}`);
  }
}

export function normalizeStyle(style: IStyle): Exclude<IStyle, string> {
  if (typeof style === 'string') {
    const isUrl =
      RE_URL.test(style) ||
      (style.startsWith('/') && !style.startsWith('/*')) ||
      style.startsWith('./') ||
      style.startsWith('../');
    return isUrl
      ? {
          src: style,
        }
      : { content: style };
  } else if (typeof style === 'object') {
    assert(
      typeof style.src === 'string' || typeof style.content === 'string',
      `Style must have either a "src" or a "content" property.`,
    );
    return style;
  } else {
    throw new Error(`Invalid style type: ${typeof style}`);
  }
}

function withDefaultMetas(metas: IMeta[] = []) {
  const hasAttr = (key: string, value?: string) =>
    metas.some(m => {
      return value
        ? m[key as keyof IMeta]?.toLowerCase() === value.toLowerCase()
        : m[key as keyof IMeta];
    });
  return [
    !hasAttr('charset') && { charset: 'utf-8' },
    !hasAttr('name', 'viewport') && {
      name: 'viewport',
      content:
        'width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0',
    },
    !hasAttr('http-equiv', 'X-UA-Compatible') && {
      'http-equiv': 'X-UA-Compatible',
      content: 'ie=edge',
    },
    ...metas,
  ].filter(Boolean) as NonNullable<IMeta[]>;
}

export const getHTMLTagsAndMetas = async (
  api: IApi,
): Promise<{
  tags: HTMLTag[];
  metas: MetaOptions;
  favicons: string[];
}> => {
  const headScripts: IScript[] = await api.applyPlugins({
    key: 'addHTMLHeadScripts',
    initialValue: api.config.headScripts || [],
  });
  const scripts: IScript[] = await api.applyPlugins({
    key: 'addHTMLScripts',
    initialValue: api.config.scripts || [],
  });
  const metas: Array<IMeta> = await api.applyPlugins({
    key: 'addHTMLMetas',
    initialValue: api.config.metas || [],
  });
  const links: Array<ILink> = await api.applyPlugins({
    key: 'addHTMLLinks',
    initialValue: api.config.links || [],
  });
  const styles: IStyle[] = await api.applyPlugins({
    key: 'addHTMLStyles',
    initialValue: api.config.styles || [],
  });
  const favicons: string[] = await api.applyPlugins({
    key: 'modifyHTMLFavicon',
    initialValue: [].concat(api.config.favicons || []),
  });
  const tags: HTMLTag[] = [
    ...(headScripts ?? []).map<HTMLTag>(v => {
      const { src, content, ...rest } = normalizeScript(v);
      return {
        tag: 'script',
        head: true,
        attrs: {
          ...rest,
          src,
        },
        publicPath: false,
        children: content,
        append: false,
      };
    }),
    ...(scripts ?? []).map<HTMLTag>(v => {
      const { src, content, ...rest } = normalizeScript(v);
      return {
        tag: 'script',
        head: false,
        attrs: {
          ...rest,
          src,
        },
        publicPath: false,
        children: content,
        append: true,
      };
    }),
    ...(styles ?? []).map<HTMLTag>(v => {
      const { src, content, ...rest } = normalizeScript(v);
      return {
        tag: 'style',
        head: true,
        attrs: {
          ...rest,
          src,
        },
        publicPath: false,
        children: content,
        append: false,
      };
    }),
    ...(links ?? []).map<HTMLTag>(v => {
      return {
        tag: 'link',
        head: true,
        attrs: {
          ...(typeof v === 'object' ? v ?? {} : {}),
        },
        publicPath: false,
        append: false,
      };
    }),
  ];

  const meta: MetaOptions = withDefaultMetas(metas).reduce((acc, item) => {
    return {
      ...acc,
      ...item,
    };
  });

  return {
    tags,
    metas: meta,
    favicons,
  };
};
