import { logger } from '@umijs/utils';
import express from '@umijs/bundler-utils/compiled/express';
import {
  createRsbuild,
  RsbuildConfig,
  loadConfig,
  mergeRsbuildConfig,
} from '@rsbuild/core';
import { RsbuildBundlerConfig, MultiStats, Stats } from '@/types';
import { convertBundlerConfigToRsbuildConfig } from '@/common';

export async function dev(bundlerConfig: RsbuildBundlerConfig) {
  const {
    cwd,
    beforeMiddlewares,
    onBeforeMiddleware,
    onDevCompileDone,
    // onProgress,
    afterMiddlewares,
  } = bundlerConfig;
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
    const app = express();
    const rsbuildServer = await rsbuild.createDevServer();
    rsbuild.onDevCompileDone(params => {
      const s: Stats = (params.stats as MultiStats)?.stats
        ? (params.stats as MultiStats)?.stats?.[0]
        : (params.stats as Stats);
      onDevCompileDone?.({
        isFirstCompile: params.isFirstCompile,
        stats: params.stats,
        time:
          s.compilation?.endTime && s.compilation?.startTime
            ? s.compilation?.endTime - s.compilation?.startTime
            : undefined,
      });
    });
    onBeforeMiddleware?.(app);
    (beforeMiddlewares || []).forEach(v => app.use(v));
    app.use(rsbuildServer.middlewares);
    (afterMiddlewares || []).forEach(v => app.use(v));

    const httpServer = app.listen(rsbuildServer.port, async () => {
      // 通知 Rsbuild 自定义 Server 已启动
      await rsbuildServer.afterListen();
    });
    rsbuildServer.connectWebSocket({ server: httpServer });
  } catch (err) {
    logger.error('Failed to start dev server.');
    logger.error(err);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
}
