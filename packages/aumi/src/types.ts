import { IApi as UMIAPI } from '@umijs/preset-umi';
import {
  RsbuildBundlerConfig,
  RsbuildPlugins,
  RUMIConfig,
} from '@aumi/bundler-rsbuild';
import { IModify, Env } from '@umijs/core';
import { EnableBy, IPluginConfig } from '@umijs/core/dist/types';

export type { RUMIConfig } from '@aumi/bundler-rsbuild';

type ModifyRsbuildConfigParameter = Parameters<
  Required<RsbuildBundlerConfig>['modifyRsbuildConfig']
>;

type ModifyRsbuildPluginsParameter = Parameters<
  Required<RsbuildBundlerConfig>['modifyRsbuildPlugins']
>;

export type IApi = Omit<
  UMIAPI,
  | 'addExtraBabelPresets'
  | 'addExtraBabelPlugins'
  | 'addBeforeBabelPresets'
  | 'addBeforeBabelPlugins'
  | 'modifyWebpackConfig'
  | 'modifyViteConfig'
  | 'modifyServerRendererPath'
  | 'modifyBabelPresetOpts'
> & {
  modifyRsbuildConfig: IModify<
    ModifyRsbuildConfigParameter[0],
    ModifyRsbuildConfigParameter[1]
  >;
  modifyRsbuildPlugins: IModify<
    RsbuildPlugins,
    ModifyRsbuildPluginsParameter[1]
  >;
  describe: (opts: {
    key?: string;
    config?: IPluginConfig;
    enableBy?:
      | EnableBy
      | ((enableByOpts: {
          userConfig: RUMIConfig;
          config: RUMIConfig;
          env: Env;
        }) => boolean);
  }) => void;
};
