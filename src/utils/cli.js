import { readConfig, ConfigLoaderError } from '@web/config-loader';

export async function getUserConfig() {
  let userConfig = {};
  try {
    userConfig = await readConfig('custom-elements-manifest.config');
  } catch (error) {
    if (error instanceof ConfigLoaderError) {
      console.error(error.message);
      return;
    }
    console.error(error);
    return;
  }
  return userConfig || {};
}