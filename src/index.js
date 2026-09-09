/**
 * Cloudflare Pages Function Router
 * All requests are handled by functions/ directory
 */
export default {
  async fetch(request, env, ctx) {
    // This is just a fallback - all routes should be handled by functions/
    return new Response('Not Found', { status: 404 });
  }
};
