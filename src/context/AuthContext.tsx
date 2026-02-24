import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { TeamMember } from '../types/index';

type Role = 'tpm' | 'director' | 'developer' | 'admin';

interface AuthUser extends TeamMember {
    appRole: Role;
}

interface AuthState {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

interface AuthContextType extends AuthState {
    login: (email: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock login logic based on team members
const MOCK_USERS: Record<string, Role> = {
    'admin@acme.com': 'admin',      // Default system admin — always available
    'priya@acme.com': 'admin',      // Priya - Frontend Lead (Admin for demo)
    'kavita@acme.com': 'tpm',       // Kavita - TPM
    'david@acme.com': 'director',   // David - Director
    'rahul@acme.com': 'developer',  // Rahul - Developer
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
    });

    useEffect(() => {
        // Check local storage for session on mount
        const storedUser = localStorage.getItem('pm_auth_user');
        if (storedUser) {
            setState({ user: JSON.parse(storedUser), isAuthenticated: true, isLoading: false });
        } else {
            setState({ user: null, isAuthenticated: false, isLoading: false });
        }
    }, []);

    const login = async (email: string) => {
        setState(prev => ({ ...prev, isLoading: true }));
        try {
            // Fetch team members from backend to find the user
            const res = await fetch('http://127.0.0.1:3001/api/data');
            const data = await res.json();

            // For demo, we also allow 'david@acme.com' who might not be in DB
            let member = data.teamMembers?.find((m: TeamMember) => m.email === email);

            if (!member) {
                if (email === 'david@acme.com') {
                    member = { id: 'dir1', name: 'David Park', role: 'Director', avatar: 'DP', email: 'david@acme.com', totalHoursPerWeek: 40 };
                } else {
                    throw new Error('User not found. Use admin@acme.com to login, or enable "Load Mock Data" toggle for demo accounts.');
                }
            }

            // Priority: MOCK_USERS (for hardcoded overrides) > Database appRole > default 'developer'
            const appRole = MOCK_USERS[email] || member.appRole || 'developer';
            const authUser: AuthUser = { ...member, appRole };

            localStorage.setItem('pm_auth_user', JSON.stringify(authUser));
            setState({ user: authUser, isAuthenticated: true, isLoading: false });

        } catch (error: any) {
            setState(prev => ({ ...prev, isLoading: false }));
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('pm_auth_user');
        setState({ user: null, isAuthenticated: false, isLoading: false });
    };

    return (
        <AuthContext.Provider value={{ ...state, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}
