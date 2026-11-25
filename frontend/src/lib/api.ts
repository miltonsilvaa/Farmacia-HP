const API_URL = import.meta.env.VITE_API_URL ?? '';

function getAuthHeaders(isFormData = false): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem('token_farmacia');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...getAuthHeaders(isFormData),
    ...(options.headers as Record<string, string>),
  };
  return fetch(`${API_URL}${path}`, { ...options, headers });
}

export function getUsuario(): { id: string; email: string } | null {
  try {
    return JSON.parse(localStorage.getItem('usuario_farmacia') ?? 'null');
  } catch {
    return null;
  }
}
