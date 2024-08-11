import { moduleTools, defineConfig } from '@modern-js/module-tools';
import { libraryPresetWithTarget } from '../../scripts/buildConfig';

export default defineConfig({
  plugins: [moduleTools()],
  buildConfig: libraryPresetWithTarget['npm-library-es2020'],
});
