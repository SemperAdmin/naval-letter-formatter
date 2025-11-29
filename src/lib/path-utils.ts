export function getBasePath(): string {
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname || '';
    if (pathname.startsWith('/naval-letter-formatter')) {
      return '/naval-letter-formatter';
    }
  }
  return '';
}

export function resolvePublicPath(url: string): string {
  const basePath = getBasePath();
  if (/^https?:\/\//.test(url)) return url;
  if (basePath) {
    const hasLeadingSlash = url.startsWith('/');
    return `${basePath}${hasLeadingSlash ? '' : '/'}${url}`;
  }
  return url;
}

