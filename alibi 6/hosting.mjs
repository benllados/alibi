// The website may be served by Vercel while this process runs on Render.
// Keep the trusted public origin explicit; preview deployments are not trusted
// automatically, and client-supplied forwarding headers are not trusted here.
export function hostingConfig(env = process.env) {
  let publicOrigin = '';
  if (env.PUBLIC_ORIGIN?.trim()) {
    const url = new URL(env.PUBLIC_ORIGIN.trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
        url.pathname !== '/' || url.search || url.hash) {
      throw new Error('PUBLIC_ORIGIN must be a website origin, such as https://your-game.vercel.app.');
    }
    publicOrigin = url.origin;
  }
  return {
    publicOrigin,
    hosted: Boolean(publicOrigin || env.NODE_ENV === 'production' || env.RENDER === 'true'),
    allowsOrigin(origin, host) {
      if (!origin) return true;
      try {
        const url = new URL(origin);
        if (!['http:', 'https:'].includes(url.protocol) || origin !== url.origin) return false;
        return url.origin === publicOrigin || url.host === host;
      } catch { return false; }
    },
  };
}
