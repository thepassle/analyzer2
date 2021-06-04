/**
 * GENERAL UTILITIES
 */

export const has = arr => Array.isArray(arr) && arr.length > 0;

/**
 * @example node?.decorators?.find(decorator('Component'))
 */
export const decorator = type => decorator => decorator?.expression?.expression?.getText() === type || decorator?.expression?.getText() === type;

export function isBareModuleSpecifier(specifier) {
  return !!specifier?.replace(/'/g, '')[0].match(/[@a-zA-Z]/g);
}

export function resolveModuleOrPackageSpecifier(moduleDoc, name) {
  const foundImport = moduleDoc?.imports?.find(_import => _import.name === name);

  /* item is imported from another file */
  if(foundImport) {
    if(foundImport.isBareModuleSpecifier) {
      /* import is from 3rd party package */
      return { package: foundImport.importPath }
    } else {
      /* import is imported from a local module */
      return { module: new URL(foundImport.importPath, `file:///${moduleDoc.path}`).pathname }
    }
  } else {
    /* item is in current module */
    return { module: moduleDoc.path }
  }
}

export const toKebabCase = str => {
  return str.split('').map((letter, idx) => {
    return letter.toUpperCase() === letter
     ? `${idx !== 0 ? '-' : ''}${letter.toLowerCase()}`
     : letter;
  }).join('');
}
