export function decodeToken(token) {
  try {
    if (!token || typeof token !== "string") {
      console.warn("Invalid token type:", typeof token);
      return null;
    }
    
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.warn("Token does not have 3 parts:", parts.length);
      return null;
    }
    
    // Decode with proper base64url handling
    const base64url = parts[1];
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    
    const payload = JSON.parse(jsonPayload);
    console.log("Decoded token payload:", payload);
    return payload;
  } catch (e) {
    console.error("Token decode error:", e);
    return null;
  }
}