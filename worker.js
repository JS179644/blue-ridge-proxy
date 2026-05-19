export default {
  async fetch(request, env) {

    // Handle CORS preflight — browsers send this before the real POST
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // Only allow POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Make sure the token secret is configured
    if (!env.MONDAY_TOKEN) {
      return new Response(
        JSON.stringify({ errors: [{ message: 'MONDAY_TOKEN secret not configured in Cloudflare Worker' }] }),
        { status: 500, headers: corsHeaders() }
      );
    }

    try {
      // Forward the multipart body straight to Monday's file endpoint
      // Do NOT set Content-Type — let the browser's multipart boundary pass through
      const mondayRes = await fetch('https://api.monday.com/v2/file', {
        method: 'POST',
        headers: {
          'Authorization': env.MONDAY_TOKEN,
          'API-Version': '2024-01'
        },
        body: request.body
      });

      const text = await mondayRes.text();

      return new Response(text, {
        status: mondayRes.status,
        headers: corsHeaders()
      });

    } catch (err) {
      return new Response(
        JSON.stringify({ errors: [{ message: 'Worker fetch error: ' + err.message }] }),
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
