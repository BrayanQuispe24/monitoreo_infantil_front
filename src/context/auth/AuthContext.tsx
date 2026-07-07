import { createContext, useEffect, useState } from "react";

type User = {
    id: string,
    username: string,
    email: string,
    role: string,
    daycare_id: string,
    created_at: string
}

type AuthContextType = {
    user: User | null;
    token: string | null;
    login(user: User, token: string): void;
    logout(): void;

}

const getInitialAuth = (): { user: User | null; token: string | null } => {
    const storedData = localStorage.getItem("authData");
    if (!storedData) {
        return { user: null, token: null }
    }
    try {
        return JSON.parse(storedData);
    } catch {
        localStorage.removeItem("authData");
        return { user: null, token: null }
    }
}
export const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider = ({ children }: { children: React.ReactNode }) => {

    const [user, setUser] = useState<User | null>(getInitialAuth().user);
    const [token, setToken] = useState<string | null>(getInitialAuth().token);

    const login = (userData: User, userToken: string) => {
        setToken(userToken);
        setUser(userData);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
    };

    useEffect(() => {

        if (user && token) {
            localStorage.setItem("authData", JSON.stringify({ user, token }));
        } else {
            localStorage.removeItem("authData");
        }
    }, [user, token]);



    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}