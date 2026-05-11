'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

// Mapping predefined Firebase users to their specific roles
const ROLE_MAP: Record<string, UserRole> = {
  'broiler@muveste.com': 'broiler_farm',
  'butchery-kibungo@muveste.com': 'butcher_kibungo',
  'butcher-kibungo@muveste.com': 'butcher_kibungo',
  'butchery-rwamagana@muveste.com': 'butcher_rwamagana',
  'butcher-rwamagana@muveste.com': 'butcher_rwamagana',
  'butchery-nyabugogo@muveste.com': 'butcher_nyabugogo',
  'butcher-nyabugogo@muveste.com': 'butcher_nyabugogo',
  'finance@muveste.com': 'finance',
  'admin@muveste.com': 'admin',
};

// Role-based routing
const roleRoutes: Record<string, string> = {
  'broiler_farm'      : '/broiler-farm',
  'butcher_kibungo'   : '/butcher-kibungo',
  'butcher_rwamagana' : '/butcher-rwamagana',
  'butcher_nyabugogo' : '/butcher-nyabugogo',
  'finance'           : '/finance',
  'admin'             : '/admin',
};

function getRoleFromEmail(email: string | null): UserRole | null {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  
  if (ROLE_MAP[cleanEmail]) return ROLE_MAP[cleanEmail];
  
  // Smart fallback mapping
  if (cleanEmail.includes('kibungo')) return 'butcher_kibungo';
  if (cleanEmail.includes('rwamagana')) return 'butcher_rwamagana';
  if (cleanEmail.includes('nyabugogo')) return 'butcher_nyabugogo';
  if (cleanEmail.includes('broiler')) return 'broiler_farm';
  if (cleanEmail.includes('finance')) return 'finance';
  if (cleanEmail.includes('admin')) return 'admin';

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser && firebaseUser.email) {
        const role = getRoleFromEmail(firebaseUser.email);

        // Only set user if they have a recognized role in our system
        if (role) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role,
          });
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
