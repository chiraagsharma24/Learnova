import { useState, useEffect, createContext, useContext, useCallback, useMemo } from "react";
import type { ReactNode } from "react";

import { loginUser, registerUser, logoutUser, getSession } from "@/fetchers/auth";
import { fetchMe, becomeInstructor as becomeInstructorApi } from "@/fetchers/user";
import type { UserProfile } from "@/types/user";

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<UserProfile>;
    register: (name: string, email: string, password: string, role?: string) => Promise<void>;
    logout: () => Promise<void>;
    becomeInstructor: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface Props {
  children: ReactNode
}

export function AuthProvider({ children }: Props){
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshProfile = useCallback(async () => {
        try {
            const profile = await fetchMe();
            setUser(profile);
        } catch {
            setUser(null);
            throw new Error("Failed to fetch profile");
        }
    }, []);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const sessionRes = await getSession();
                if (sessionRes?.user) {
                    await refreshProfile();
                }
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkSession();
    }, [refreshProfile]);

    const login = useCallback(async (email: string, password: string) => {
        setLoading(true);
        try {
            await loginUser(email, password);
            const profile = await fetchMe();
            setUser(profile);
            return profile;
        } finally {
            setLoading(false);
        }
    }, []);

    const register = useCallback(async (
        name: string,
        email: string,
        password: string,
        role?: string
    ) => {
        setLoading(true);
        try {
            await registerUser(name, email, password, role);
            await refreshProfile();
        } finally {
            setLoading(false);
        }
    }, [refreshProfile]);

    const logout = useCallback(async () => {
        setLoading(true);
        try {
            await logoutUser();
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const becomeInstructor = useCallback(async () => {
        setLoading(true);
        try {
            await becomeInstructorApi();
            await refreshProfile();
        } finally {
            setLoading(false);
        }
    }, [refreshProfile]);

    const value = useMemo(() => ({
        user,
        loading,
        login,
        register,
        logout,
        becomeInstructor,
        refreshProfile,
    }), [user, loading, login, register, logout, becomeInstructor, refreshProfile]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
