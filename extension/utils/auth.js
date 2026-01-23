import { supabase } from './supabase.js'

class AuthManager {
  constructor() {
    this.user = null
    this.session = null
  }

  async initialize() {
    // Get session from storage
    const { data: { session } } = await supabase.auth.getSession()
    this.session = session
    this.user = session?.user || null
    
    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      this.session = session
      this.user = session?.user || null
      this.notifyAuthChange(event)
    })
  }

  async signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })
    
    if (error) throw error
    return data
  }

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  }

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  async getAccessToken() {
    if (!this.session) {
      throw new Error('No active session')
    }
    return this.session.access_token
  }

  isAuthenticated() {
    return !!this.user
  }

  getUser() {
    return this.user
  }

  notifyAuthChange(event) {
    // Send message to popup
    chrome.runtime.sendMessage({
      type: 'AUTH_STATE_CHANGED',
      event,
      user: this.user
    })
  }
}

export const authManager = new AuthManager()
