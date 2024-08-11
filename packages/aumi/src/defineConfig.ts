// @ts-expect-error
import { IConfigFromPlugins } from '@@/core/pluginConfig';
import type { RUMIConfig } from '@aumi/bundler-rsbuild';

type ConfigType = IConfigFromPlugins & RUMIConfig;

export const defineAUMIConfig = (config: ConfigType): ConfigType => {
  return config;
};
