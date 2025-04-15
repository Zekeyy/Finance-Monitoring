import { createContext, useContext, useState } from "react";

const StateContext = createContext({
    user: null,
    token: null,
    setUser: () => {},
    setToken: () => {},
});

export const ContextProvider = ({ children }) => {
    const [user, setUser] = useState({});
    const [token, _setToken] = useState(localStorage.getItem("access_token"));

    const setToken = (token) => {
        _setToken(token);
        if (token) {
            localStorage.setItem("access_token", token);
        } else {
            localStorage.removeItem("access_token");
        }
    };
    const updateUser = (userData) => {
        setUser(userData);
    };
    const updateToken = (newToken) => {
        setToken(newToken);
        if (newToken) {
            localStorage.setItem("access_token", newToken);
        } else {
            localStorage.removeItem("access_token");
        }
    };
    return (
        <StateContext.Provider
            value={{
                user,
                token,
                setUser,
                setToken,
            }}
        >
            {children}
        </StateContext.Provider>
    );
};

export const useStateContext = () => useContext(StateContext);
