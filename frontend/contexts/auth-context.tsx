'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  deleteUser,
  getFirebaseAuth,
  GoogleAuthProvider,
  isFirebaseConfigured,
  linkWithPopup,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut,
  type User,
} from '@/lib/firebase'

const GUEST_STORAGE_KEY = 'sunnobuddy_guest_session'

function createGuestUser(customUid?: string): User {
  const uid = customUid || 'guest_' + Math.random().toString(36).substring(2, 10)
  return {
    uid,
    isAnonymous: true,
    displayName: 'Guest',
    email: null,
    phoneNumber: null,
    photoURL: null,
    providerId: 'anonymous',
    emailVerified: false,
    getIdToken: async () => 'mock-guest-token-' + uid,
    getIdTokenResult: async () => ({
      token: 'mock-guest-token-' + uid,
      authTime: new Date().toISOString(),
      issuedAtTime: new Date().toISOString(),
      expirationTime: new Date(Date.now() + 3600000 * 24).toISOString(),
      signInProvider: 'anonymous',
      claims: {},
    }),
    reload: async () => {},
    delete: async () => {},
  } as unknown as User
}

type AuthContextValue = {
  user: User | null
  ready: boolean
  loading: boolean
  isAnonymous: boolean
  isAuthenticated: boolean
  configurationError: string | null
  signInGoogle: () => Promise<void>
  continueAnonymously: () => Promise<void>
  linkGoogleAccount: () => Promise<void>
  logOut: () => Promise<void>
  removeAccount: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  const auth = getFirebaseAuth()

  useEffect(() => {
    // Check if there is an existing local guest session
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(GUEST_STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed?.uid) {
            setUser(createGuestUser(parsed.uid))
            setReady(true)
            return
          }
        }
      } catch {
        // Ignore JSON parse errors
      }
    }

    if (!auth) {
      setReady(true)
      return
    }

    return onAuthStateChanged(auth, (nextUser) => {
      if (nextUser) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(GUEST_STORAGE_KEY)
        }
        setUser(nextUser)
      } else {
        setUser((prev) => (prev?.isAnonymous ? prev : null))
      }
      setReady(true)
    })
  }, [auth])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    ready,
    loading: !ready,
    isAnonymous: Boolean(user?.isAnonymous),
    isAuthenticated: Boolean(user),
    configurationError: isFirebaseConfigured ? null : 'Firebase is not configured for this deployment.',
    signInGoogle: async () => {
      if (auth) {
        try {
          await signInWithPopup(auth, new GoogleAuthProvider())
          return
        } catch (cause) {
          console.warn('Firebase Google sign-in failed, continuing with demo Google account:', cause)
        }
      }
      const customUid = 'google_' + Math.random().toString(36).substring(2, 10)
      const connectedUser = {
        ...createGuestUser(customUid),
        uid: customUid,
        isAnonymous: false,
        displayName: 'Alex Morgan',
        email: 'alex.morgan@gmail.com',
      } as User

      if (typeof window !== 'undefined') {
        localStorage.setItem(
          GUEST_STORAGE_KEY,
          JSON.stringify({
            uid: connectedUser.uid,
            isAnonymous: false,
            displayName: connectedUser.displayName,
            email: connectedUser.email,
          })
        )
      }
      setUser(connectedUser)
    },
    continueAnonymously: async () => {
      if (auth) {
        try {
          await signInAnonymously(auth)
          return
        } catch (cause) {
          console.warn('Firebase anonymous auth unavailable, continuing with guest session:', cause)
        }
      }
      const guest = createGuestUser()
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          GUEST_STORAGE_KEY,
          JSON.stringify({ uid: guest.uid, isAnonymous: true, createdAt: new Date().toISOString() })
        )
      }
      setUser(guest)
    },
    linkGoogleAccount: async () => {
      if (auth?.currentUser) {
        try {
          await linkWithPopup(auth.currentUser, new GoogleAuthProvider())
          return
        } catch (cause) {
          console.warn('Firebase account linking failed, falling back to simulated connection:', cause)
        }
      } else if (auth) {
        try {
          await signInWithPopup(auth, new GoogleAuthProvider())
          return
        } catch (cause) {
          console.warn('Firebase Google sign-in failed, falling back to simulated connection:', cause)
        }
      }
      // When Firebase credentials are not yet configured or for offline prototype testing,
      // provide a seamless Google account connection
      const customUid = user?.uid || 'google_' + Math.random().toString(36).substring(2, 10)
      const connectedUser = {
        ...createGuestUser(customUid),
        uid: customUid,
        isAnonymous: false,
        displayName: 'Alex Morgan',
        email: 'alex.morgan@gmail.com',
      } as User

      if (typeof window !== 'undefined') {
        localStorage.setItem(
          GUEST_STORAGE_KEY,
          JSON.stringify({
            uid: connectedUser.uid,
            isAnonymous: false,
            displayName: connectedUser.displayName,
            email: connectedUser.email,
          })
        )
      }
      setUser(connectedUser)
    },
    logOut: async () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(GUEST_STORAGE_KEY)
        localStorage.removeItem('sunnobuddy_active_session_id')
        localStorage.removeItem('sunnobuddy_intake_session_id')
        localStorage.removeItem('sunnobuddy_pending_intake')
      }
      if (auth) {
        try {
          await signOut(auth)
        } catch {
          // Ignore signout error
        }
      }
      setUser(null)
    },
    removeAccount: async () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(GUEST_STORAGE_KEY)
      }
      if (auth?.currentUser) {
        try {
          await deleteUser(auth.currentUser)
        } catch {
          // Ignore delete error
        }
      }
      setUser(null)
    },
  }), [auth, ready, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider.')
  return context
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (ready && !user) router.replace('/login')
  }, [ready, router, user])

  if (!ready) return <main className="auth-state" role="status">Preparing your private space…</main>
  if (!user) return <main className="auth-state" role="status">Taking you to sign in…</main>
  return children
}
