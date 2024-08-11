// @ts-expect-error
import { IConfigFromPlugins } from '@@/core/pluginConfig';
import type { RUMIConfig } from '@rumi/bundler-rsbuild';

type ConfigType = IConfigFromPlugins & RUMIConfig;

export const defineRUMIConfig = (config: ConfigType): ConfigType => {
  return config;
};
