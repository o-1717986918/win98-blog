const configuredBase = import.meta.env.BASE_URL || '/';

export const basePath = configuredBase === '/'
  ? '/'
  : `/${configuredBase.replace(/^\/+|\/+$/g, '')}/`;

export const withBase = (path: string) => {
  if (!path.startsWith('/') || path.startsWith('//') || basePath === '/') return path;
  const prefix = basePath.slice(0, -1);
  if (path === prefix || path.startsWith(`${prefix}/`)) return path;
  return path === '/' ? basePath : `${prefix}${path}`;
};

