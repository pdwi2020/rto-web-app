export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL && process.env.NEXT_PUBLIC_API_BASE_URL.trim().length > 0
    ? process.env.NEXT_PUBLIC_API_BASE_URL
    : process.env.NODE_ENV === "production"
    ? "https://rto-backend-3dg5.onrender.com"
    : "http://localhost:8000"
