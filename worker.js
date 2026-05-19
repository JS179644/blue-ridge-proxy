export default {
  async fetch(request, env) {

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    if (!env.MONDAY_TOKEN) {
      return new Response(
        JSON.stringify({ errors: [{ message: 'MONDAY_TOKEN secret not set in Cloudflare Worker settings' }] }),
        { status: 500, headers: corsHeaders() }
      );
    }

    try {
      // Read the full body as an ArrayBuffer so we don't lose the multipart boundary
      const bodyBuffer = await request.arrayBuffer();

      // Grab the Content-Type from the incoming request — this includes the
      // multipart boundary string that Monday needs to parse the file correctly
      const contentType = request.headers.get('Content-Type') || '';

      const mondayRes = await fetch('https://api.monday.com/v2/file', {
        method: 'POST',
        headers: {
          'Authorization': env.MONDAY_TOKEN,
          'API-Version': '2024-01',
          'Content-Type': contentType   // <-- critical: passes the boundary through
        },
        body: bodyBuffer
      });

      const text = await mondayRes.text();

      return new Response(text, {
        status: mondayRes.status,
        headers: corsHeaders()
      });

    } catch (err) {
      return new Response(
        JSON.stringify({ errors: [{ message: 'Worker error: ' + err.message }] }),
        { status: 500, headers: corsHeaders() }
      );
    }
  }
};

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}
