import { dirname, join, resolve } from 'path';
import { existsSync } from 'fs';
import { Env, Service as CoreService } from '@umijs/core';
import { FRAMEWORK_NAME, DEFAULT_CONFIG_FILES } from 'umi/dist/constants';
import { getCwd } from 'umi/dist/service/cwd';

type IOpts = ConstructorParameters<typeof CoreService>[0];

export class Service extends CoreService {
  constructor(opts?: IOpts) {
    process.env.UMI_DIR = resolve(require.resolve('umi'), '../../');
    // Why?
    // plugin import from umi but don't explicitly depend on it
    // and we may also have old umi installed
    // ref: https://github.com/umijs/umi/issues/8342#issuecomment-1182654076
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('umi/dist/service/requireHook');
    const cwd = getCwd();
    super({
      ...opts,
      env: process.env.NODE_ENV as Env,
      cwd,
      defaultConfigFiles: opts?.defaultConfigFiles || DEFAULT_CONFIG_FILES,
      frameworkName: opts?.frameworkName || FRAMEWORK_NAME,
      presets: [
        resolve(__dirname, '../preset-aumi/index'),
        ...(opts?.presets || []),
      ],
      plugins: [
        existsSync(join(cwd, 'plugin.ts')) && join(cwd, 'plugin.ts'),
        existsSync(join(cwd, 'plugin.js')) && join(cwd, 'plugin.js'),
      ].filter(Boolean) as string[],
    });
  }

  async run2(opts: { name: string; args?: Record<string, any> }) {
    let { name } = opts;
    if (opts?.args?.version || name === 'v') {
      name = 'version';
    } else if (opts?.args?.help || !name || name === 'h') {
      name = 'help';
    }

    return await this.run({ ...opts, name });
  }
}
