export default async function handler(req, res) {
  const backend = "https://org-management-system-p2wu.onrender.com";

  // Build backend URL by removing /api/proxy from frontend request
  const url = backend + req.url.replace("/api/proxy", "");

  try {
    // Read body manually (Vercel does NOT auto-parse req.body)
    let body = undefined;

    if (req.method !== "GET") {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = Buffer.concat(chunks).toString();
    }

    // Forward request
    const backendRes = await fetch(url, {
      method: req.method,
      headers: {
        "Content-Type": req.headers["content-type"] || "application/json",
        "Authorization": req.headers["authorization"] || ""
      },
      body,
    });

    const text = await backendRes.text();

    // If backend returned JSON, parse it
    try {
      res.status(backendRes.status).json(JSON.parse(text));
    } catch {
      res.status(backendRes.status).send(text);
    }

  } catch (err) {
    res.status(500).json({
      detail: "Proxy failed",
      error: err.message,
    });
  }
}
