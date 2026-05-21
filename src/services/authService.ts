import { ID } from "appwrite";
import { account } from "../lib/appwrite";

export interface User {
  $id: string;
  email: string;
  name: string;
}

class AuthService {
  // Start Google OAuth sign-in
  async loginWithGoogle(): Promise<void> {
    const redirectUrl = window.location.origin;
    await account.createOAuth2Session("google", redirectUrl, redirectUrl);
  }

  // Register new user
  async register(email: string, password: string, name: string): Promise<User> {
    try {
      const user = await account.create(ID.unique(), email, password, name);
      // Auto login after registration
      await this.login(email, password);
      return user as User;
    } catch (error) {
      const message = (error as any)?.message || "";
      const type = (error as any)?.type || "";
      if (
        type === "user_session_already_exists" ||
        message.includes("session is active")
      ) {
        return (await account.get()) as User;
      }
      console.error("Registration error:", error);
      throw error;
    }
  }

  // Login user
  async login(email: string, password: string): Promise<any> {
    try {
      return await account.createEmailPasswordSession(email, password);
    } catch (error) {
      const message = (error as any)?.message || "";
      const type = (error as any)?.type || "";
      if (
        type === "user_session_already_exists" ||
        message.includes("session is active")
      ) {
        // Reuse the existing session instead of failing the login flow.
        return await account.get();
      }
      console.error("Login error:", error);
      throw error;
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await account.deleteSession("current");
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      return (await account.get()) as User;
    } catch (error) {
      return null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      await account.get();
      return true;
    } catch {
      return false;
    }
  }
}

export default new AuthService();
