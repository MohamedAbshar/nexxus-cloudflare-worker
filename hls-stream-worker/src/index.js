export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const key = url.pathname.slice(1);

      if (!key) {
        return new Response("Missing key", { status: 400 });
      }

      const rangeHeader = request.headers.get("Range");

      const object = await env.R2_BUCKET.get(key, {
        range: rangeHeader ? rangeHeader : undefined,
        // IMPORTANT FIX:
        onlyIf: {},
      });

      if (!object) {
        return new Response("Object not found", { status: 404 });
      }

      // Get the data from the object
      const body = object.body;

      const headers = new Headers();
      headers.set("Access-Control-Allow-Origin", "*");
      headers.set("Accept-Ranges", "bytes");

      if (key.endsWith(".m3u8")) {
        headers.set("Content-Type", "application/vnd.apple.mpegurl");
      } else if (key.endsWith(".ts")) {
        headers.set("Content-Type", "video/mp2t");
      }

      return new Response(body, {
        status: rangeHeader ? 206 : 200,
        headers,
      });

    } catch (err) {
      return new Response("Worker error: " + err.message, { status: 500 });
    }
  },
};