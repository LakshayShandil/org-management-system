export default async function handler(req, res) {
  const backendURL = "https://org-management-system-p2wu.onrender.com";

  const targetURL = backendURL + req.url.replace("/api/proxy", "");

  console.log("Proxy call →", targetURL);

  try {
    const response = await fetch(targetURL, {
      method: req.method,
      headers: {
        "Content-Type": req.headers["content-type"] || "application/json",
        "Authorization": req.headers["authorization"] || "",
      },
      body: req.method !== "GET" ? req.body : undefined,
    });

    const text = await response.text();

    res.status(response.status);
    res.send(text);

  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Proxy failed", details: err.message });
  }
}
