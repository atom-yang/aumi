import {
  logger,
  printHelp,
  setNoDeprecation,
  setNodeTitle,
  yParser,
} from '@umijs/utils';
import { DEV_COMMAND, FRAMEWORK_NAME } from 'umi/dist/constants';
import { Service } from '@/service/service';

setNodeTitle(`${FRAMEWORK_NAME}-dev`);
setNoDeprecation();

(async () => {
  try {
    const args = yParser(process.argv.slice(2));
    const service = new Service();
    await service.run2({
      name: DEV_COMMAND,
      args,
    });

    let closed = false;
    // kill(2) Ctrl-C
    process.once('SIGINT', () => onSignal('SIGINT'));
    // kill(3) Ctrl-\
    process.once('SIGQUIT', () => onSignal('SIGQUIT'));
    // kill(15) default
    process.once('SIGTERM', () => onSignal('SIGTERM'));
    // eslint-disable-next-line no-inner-declarations
    function onSignal(signal: string) {
      if (closed) {
        return;
      }
      closed = true;
      // 退出时触发插件中的 onExit 事件
      service.applyPlugins({
        key: 'onExit',
        args: {
          signal,
        },
      });
      // eslint-disable-next-line no-process-exit
      process.exit(0);
    }
  } catch (e) {
    logger.fatal(e);
    printHelp.exit();
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
})();
