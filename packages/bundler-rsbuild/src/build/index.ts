import {
  createRsbuild,
  loadConfig,
  mergeRsbuildConfig,
  RsbuildConfig,
} from '@rsbuild/core';
import { logger } from '@umijs/utils';
import { convertBundlerConfigToRsbuildConfig } from '@/common';
import { RsbuildBundlerConfig, Stats, MultiStats } from '@/types';

export async function build(bundlerConfig: RsbuildBundlerConfig) {
  const { watch, cwd, onBuildComplete } = bundlerConfig;
  const { content: contentFromFile, filePath } = await loadConfig({
    cwd,
  });
  let rsConfig: RsbuildConfig = await convertBundlerConfigToRsbuildConfig(
    bundlerConfig,
  );
  if (filePath && Object.keys(contentFromFile).length > 0) {
    rsConfig = mergeRsbuildConfig(rsConfig, contentFromFile);
  }
  const rsbuild = await createRsbuild({
    cwd,
    rsbuildConfig: rsConfig,
  });
  try {
    rsbuild.onAfterBuild(params => {
      const s: Stats = (params.stats as MultiStats)?.stats
        ? (params.stats as MultiStats)?.stats?.[0]
        : (params.stats as Stats);
      onBuildComplete?.({
        isFirstCompile: params.isFirstCompile,
        stats: params.stats,
        time:
          s.compilation?.endTime && s.compilation?.startTime
            ? s.compilation?.endTime - s.compilation?.startTime
            : undefined,
      });
    });
    await rsbuild.build({
      watch: watch ?? false,
    });
  } catch (e) {
    logger.error(`build执行出错`);
    logger.error(e);
  }
}
