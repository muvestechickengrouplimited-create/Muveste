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
  'eggfarm@30plus.rw': 'egg_farm',
  'broiler@30plus.rw': 'broiler_farm',
  'eggkiosk@30plus.rw': 'egg_kiosk',
  'butcher@30plus.rw': 'butcher',
  'finance@30plus.rw': 'finance',
  'admin@30plus.rw': 'admin',
};

function getRoleFromEmail(email: string | null): UserRole | null {
  if (!email) return null;
  return ROLE_MAP[email.toLowerCase()] || null;
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
