// Custom client that proxies all requests to the local Express/MySQL API server

const API_URL = 'http://localhost:3001';

// Listeners for auth state changes
const authListeners: Array<(event: string, session: any) => void> = [];

const notifyAuthChange = (event: string, session: any) => {
  for (const listener of authListeners) {
    try {
      listener(event, session);
    } catch (e) {
      console.error('Error in auth state change listener:', e);
    }
  }
};

class SupabaseQueryBuilder {
  private table: string;
  private method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET';
  private eqId: string | null = null;
  private payload: any = null;
  private isSingle = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = '*') {
    this.method = 'GET';
    return this;
  }

  order(column: string, options?: { ascending: boolean }) {
    // Backend handles sorting automatically, so we can ignore this
    return this;
  }

  eq(column: string, value: any) {
    if (column === 'id') {
      this.eqId = value;
    }
    return this;
  }

  maybeSingle() {
    this.isSingle = true;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  insert(data: any[]) {
    this.method = 'POST';
    this.payload = data[0]; // extract first element from array
    return this;
  }

  update(data: any) {
    this.method = 'PUT';
    this.payload = data;
    return this;
  }

  delete() {
    this.method = 'DELETE';
    return this;
  }

  upsert(data: any, options?: any) {
    this.method = 'POST';
    this.payload = data;
    return this;
  }

  // Thenable implementation to support await/then directly
  async then(resolve: (value: any) => void, reject?: (reason: any) => void) {
    try {
      const result = await this.execute();
      resolve(result);
    } catch (err) {
      if (reject) reject(err);
    }
  }

  private async execute() {
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let path = `/api/${this.table}`;
      if (this.table === 'global_settings') {
        path = '/api/settings';
      } else if (this.table === 'project_folders') {
        path = '/api/folders';
      }

      if (this.eqId) {
        path += `/${this.eqId}`;
      }

      const response = await fetch(`${API_URL}${path}`, {
        method: this.method,
        headers,
        body: this.payload ? JSON.stringify(this.payload) : undefined,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        return { data: null, error: { message: errData.error || `HTTP error ${response.status}` } };
      }

      const data = await response.json();
      
      // If we expect a single result and data is an array
      if (this.isSingle && Array.isArray(data)) {
        return { data: data[0] || null, error: null };
      }

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message || 'Erro de rede' } };
    }
  }
}

export const supabase = {
  auth: {
    getUser: async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) return { data: { user: null }, error: null };
      try {
        const user = JSON.parse(userStr);
        return { data: { user }, error: null };
      } catch (e) {
        return { data: { user: null }, error: null };
      }
    },

    getSession: async () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (!token || !userStr) return { data: { session: null }, error: null };
      try {
        const user = JSON.parse(userStr);
        return { data: { session: { access_token: token, user } }, error: null };
      } catch (e) {
        return { data: { session: null }, error: null };
      }
    },

    signInWithPassword: async ({ email, password }: any) => {
      try {
        const response = await fetch(`${API_URL}/api/auth/signin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          return { data: { session: null, user: null }, error: { message: errData.error || 'Credenciais inválidas' } };
        }

        const { token, user } = await response.json();
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        const session = { access_token: token, user };
        notifyAuthChange('SIGNED_IN', session);

        return { data: { session, user }, error: null };
      } catch (err: any) {
        return { data: { session: null, user: null }, error: { message: err.message || 'Erro de rede' } };
      }
    },

    signUp: async ({ email, password }: any) => {
      try {
        const response = await fetch(`${API_URL}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          return { data: { session: null, user: null }, error: { message: errData.error || 'Erro ao cadastrar' } };
        }

        const { token, user } = await response.json();
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        const session = { access_token: token, user };
        notifyAuthChange('SIGNED_IN', session);

        return { data: { session, user }, error: null };
      } catch (err: any) {
        return { data: { session: null, user: null }, error: { message: err.message || 'Erro de rede' } };
      }
    },

    signOut: async () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      notifyAuthChange('SIGNED_OUT', null);
      return { error: null };
    },

    updateUser: async ({ password }: any) => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/auth/update-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ password })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          return { error: { message: errData.error || 'Erro ao atualizar a senha' } };
        }

        return { error: null };
      } catch (err: any) {
        return { error: { message: err.message || 'Erro de rede' } };
      }
    },

    onAuthStateChange: (cb: (event: string, session: any) => void) => {
      authListeners.push(cb);
      
      // Emit current status immediately
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      let session = null;
      if (token && userStr) {
        try {
          session = { access_token: token, user: JSON.parse(userStr) };
        } catch (e) {}
      }
      
      setTimeout(() => {
        cb(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
      }, 0);

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              const index = authListeners.indexOf(cb);
              if (index !== -1) {
                authListeners.splice(index, 1);
              }
            }
          }
        }
      };
    }
  },

  from: (table: string) => {
    return new SupabaseQueryBuilder(table);
  }
} as any;