import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

interface AuthContextType {
  user: any | null;
  firebaseUser: FirebaseUser | null;
  uid: string | null;
  authReady: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  uid: null,
  authReady: false,
  isAuthenticated: false,
});

export function AuthProvider({
  children,
  currentUser,
}: {
  children: React.ReactNode;
  currentUser: any | null;
}) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [authReady, setAuthReady] = useState(Boolean(currentUser?.uid || auth.currentUser?.uid));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const uid = currentUser?.uid || firebaseUser?.uid || null;
  const isAuthenticated = Boolean(uid);

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        firebaseUser,
        uid,
        authReady,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
