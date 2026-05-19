export default {
  async fetch(request, env) {

    // Only allow POST
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Forward the multipart body straight to Monday's file endpoint
    const mondayRes = await fetch("https://api.monday.com/v2/file", {
      method: "POST",
      headers: {
        "Authorization": env.MONDAY_TOKEN,
        "API-Version": "2024-01"
        // Do NOT set Content-Type — let fetch carry the multipart boundary through
      },
      body: request.body
    });

    const result = await mondayRes.text();

    // Return response with CORS headers so the browser app can read it
    return new Response(result, {
      status: mondayRes.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }
};
