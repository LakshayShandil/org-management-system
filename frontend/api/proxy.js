export const config = {
  api: {
    bodyParser: false, // Required to forward raw body
  },
};

export default async function handler(req, res) {
  const backendBase = "https://org-management-system-p2wu.onrender.com";

  // Remove "/api/proxy" from path and forward to backend
  const targetUrl = backendBase + req.url.replace("/api/proxy", "");

  // ---- FORWARD HEADERS ----
  const headers = {};

  // Preserve content-type
  if (req.headers["content-type"]) {
    headers["Content-Type"] = req.headers["content-type"];
  }

  // Preserve Authorization (VERY IMPORTANT)
  if (req.headers["authorization"]) {
    headers["Authorization"] = req.headers["authorization"];
  }

  // ---- READ RAW BODY ----
  let body = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await new Promise((resolve) => {
      let data = [];
      req.on("data", chunk => data.push(chunk));
      req.on("end", () => resolve(Buffer.concat(data)));
    });
  }

  // ---- SEND REQUEST TO BACKEND ----
  const backendResponse = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
  });

  // ---- SEND BACKEND RESPONSE TO FRONTEND ----
  const data = await backendResponse.text();
  res.status(backendResponse.status).send(data);
}
