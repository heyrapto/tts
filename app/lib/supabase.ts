import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isMock = !supabaseUrl || !supabaseAnonKey;

// Mock user object for demo mode
export const mockUser = {
  id: "demo-user-id",
  email: "demo-user@example.com",
  user_metadata: {
    name: "Demo User",
    avatar_url: "https://lh3.googleusercontent.com/a/default-user=s96-c",
    full_name: "Demo User",
  },
};

export const mockSession = {
  access_token: "mock-token",
  user: mockUser,
};

class MockAuth {
  private listeners: Array<(event: string, session: any) => void> = [];

  constructor() {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("demo_session");
      if (stored === "true") {
        setTimeout(() => {
          this.trigger("SIGNED_IN", mockSession);
        }, 100);
      }
    }
  }

  private trigger(event: string, session: any) {
    this.listeners.forEach((cb) => cb(event, session));
  }

  async getSession() {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("demo_session");
      if (stored === "true") {
        return { data: { session: mockSession }, error: null };
      }
    }
    return { data: { session: null }, error: null };
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    this.listeners.push(callback);
    this.getSession().then(({ data }) => {
      callback(data.session ? "INITIAL_SESSION" : "SIGNED_OUT", data.session);
    });
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners = this.listeners.filter((cb) => cb !== callback);
          },
        },
      },
    };
  }

  async signInWithOAuth({ provider }: { provider: string }) {
    console.log(`Mock signing in via OAuth provider: ${provider}`);
    if (typeof window !== "undefined") {
      localStorage.setItem("demo_session", "true");
      this.trigger("SIGNED_IN", mockSession);
    }
    return { data: {}, error: null };
  }

  async signOut() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("demo_session");
      this.trigger("SIGNED_OUT", null);
    }
    return { error: null };
  }
}

export const supabase = isMock
  ? ({ auth: new MockAuth() } as any)
  : createClient(supabaseUrl, supabaseAnonKey);
