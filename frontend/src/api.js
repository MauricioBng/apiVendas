function getApiBase() {
  if (import.meta.env.VITE_API_URL) {
    return String(import.meta.env.VITE_API_URL).replace(/\/$/, "");
  }
  if (import.meta.env.DEV) {
    return "/api";
  }
  return "http://localhost:3000";
}

const API_URL = getApiBase();

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });
  } catch (err) {
    const hint =
      "Não foi possível conectar à API. Inicie o backend (npm run start na raiz do projeto, porta 3000) e tente de novo.";
    throw new Error(err instanceof TypeError ? hint : String(err));
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.error || "Erro na requisição.";
    throw new Error(message);
  }
  return payload;
}

export const api = {
  list(resource, params = {}) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        search.set(key, String(value));
      }
    }
    const query = search.toString();
    return request(`/${resource}${query ? `?${query}` : ""}`);
  },
  create(resource, data) {
    return request(`/${resource}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  update(resource, id, data) {
    return request(`/${resource}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  remove(resource, id) {
    return request(`/${resource}/${id}`, {
      method: "DELETE",
    });
  },
};
