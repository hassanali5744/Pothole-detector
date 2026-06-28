import { useAuthStore } from "./store/auth-store";
import { API_BASE_URL } from "./constants";

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

function parseErrorDetail(body: unknown): string {
  if (!body || typeof body !== "object") return "Request failed";
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => String(d)).join(", ");
  return "Request failed";
}

async function request(path: string, options: RequestOptions = {}) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${cleanPath}`);

  if (options.params) {
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "all") {
        url.searchParams.append(key, val);
      }
    });
  }

  const headers = new Headers(options.headers);
  const token = useAuthStore.getState().token;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url.toString(), { ...options, headers });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(parseErrorDetail(errorBody));
  }

  if (response.status === 204) return null;
  return response.json();
}

export const apiClient = {
  get: (path: string, options?: RequestOptions) => request(path, { ...options, method: "GET" }),
  post: (path: string, body: unknown, options?: RequestOptions) =>
    request(path, { ...options, method: "POST", body: JSON.stringify(body) }),
  postForm: (path: string, formData: FormData, options?: RequestOptions) =>
    request(path, { ...options, method: "POST", body: formData }),
  patch: (path: string, body: unknown, options?: RequestOptions) =>
    request(path, { ...options, method: "PATCH", body: JSON.stringify(body) }),
  put: (path: string, body: unknown, options?: RequestOptions) =>
    request(path, { ...options, method: "PUT", body: JSON.stringify(body) }),
  delete: (path: string, options?: RequestOptions) =>
    request(path, { ...options, method: "DELETE" }),
};
