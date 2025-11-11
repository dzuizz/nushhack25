"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, getData, setData, updateData, stamp } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User as FirebaseUser,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { User } from "@/types";

interface authContext {
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  FBuser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<authContext | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [FBuser, setFBuser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const leave = onAuthStateChanged(auth, async (FBuser) => {
      setFBuser(FBuser);
      if (FBuser) {
        const existingUser = await getData<User>(`users/${FBuser.uid}`);

        if (existingUser) {
          setUser(existingUser);
        } else {
          const newUser: User = {
            email: FBuser.email || "",
            hasCompletedProfile: false,
            conversationsCompleted: [],
            createdAt: Date.now(),
            uid: FBuser.uid,
            hobbies: [],
            major: "",
            name: "",
            score: 0,
          };
          await setData(`users/${FBuser.uid}`, newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return leave;
  }, []);

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateUserProfile = async (data: Partial<User>) => {
    if (!FBuser) return;

    await updateData(`users/${FBuser.uid}`, data);

    const updatedUser = { ...user, ...data } as User;
    setUser(updatedUser);
  };

  const value = {
    updateUserProfile,
    FBuser,
    loading,
    signUp,
    signIn,
    logout,
    user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined)
    throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
