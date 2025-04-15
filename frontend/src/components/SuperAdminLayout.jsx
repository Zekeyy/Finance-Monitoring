import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import "../styles/secretary.css";
import logo from "../assets/images/GammaCareLogo.png";
import api from '../axiosConfig';
import { HomeIcon, PlusIcon, ListBulletIcon,UsersIcon } from '@heroicons/react/24/outline';

function SuperAdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const sidebarRef = useRef(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isXlScreen, setIsXlScreen] = useState(false);

    const [headerText, setHeaderText] = useState(() => {
        // First check sessionStorage
        const storedHeader = sessionStorage.getItem("headerText");
        if (storedHeader) return storedHeader;
        
        // If no stored header, determine from current path
        const path = location.pathname;
        if (path.includes('/super-admin-transaction-history')) return "Transaction History";
        if (path.includes('/super-admin-transaction')) return "Add Transaction";
        if (path.includes('/super-admin-user-lists')) return "User Management";
        return "Dashboard"; // Default fallback
    });
    useEffect(() => {
        // Update header based on current path
        const path = location.pathname;
        if (path.includes('/super-admin-transaction-history')) {
            handleHeaderChange("Transaction History");
        } else if (path.includes('/super-admin-transaction')) {
            handleHeaderChange("Add Transaction");
        } else if (path.includes('/super-admin-dashboard')) {
            handleHeaderChange("Dashboard");
        } else if (path.includes('/super-admin-user-lists')) {
            handleHeaderChange("User Management");
        }
    }, [location.pathname]);

    // Function to update header text and store in sessionStorage
    const handleHeaderChange = (text) => {
        setHeaderText(text);
        sessionStorage.setItem("headerText", text);
    };
    
useEffect(() => {
    const handleClickOutside = (event) => {
        if (isXlScreen) return; // Prevent closing on XL screens

        if (sidebarRef.current && 
            !sidebarRef.current.contains(event.target) && 
            !event.target.closest('.sidebar-toggle')) {
            setIsSidebarVisible(false);

            // Ensure content container margin resets when sidebar is closed
            const contentContainer = document.querySelector('.content-container');
            if (contentContainer) {
                contentContainer.style.marginLeft = '0';
            }
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
}, [isXlScreen]); // Add dependency to re-run effect when screen size changes


    
    
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('auth_token');
            
            if (!token) {
                navigate('/');
                return;
            }
            
            try {
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                const response = await api.get("user");
                
                if (response.data.user) {
                    setUserData(response.data.user);
                    localStorage.setItem("user", JSON.stringify(response.data.user));
                }
                setLoading(false);
            } catch (error) {
                console.error("Auth error:", error);
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                localStorage.removeItem('isLoggedIn');
                navigate('/');
            }
        };

        checkAuth();
    }, [navigate]);

    // Reset the header to "Dashboard" when the tab or browser is closed
    // Update your existing useEffect for beforeunload
useEffect(() => {
    const handleBeforeUnload = () => {
        // Clear all session data related to header
        sessionStorage.removeItem("headerText");
        
        // If you have other session data that should be cleared on page close:
        // sessionStorage.clear(); // Use this if you want to clear ALL sessionStorage
        
        // Note: You cannot reliably clear localStorage on page close
        // as browsers handle this differently for security reasons
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
    };
}, []);

    // Modified effect to handle sidebar visibility based on screen size
    useEffect(() => {
        const handleResize = () => {
            const xlBreakpoint = 1280;
            const isXl = window.innerWidth >= xlBreakpoint;
            
            // Update XL screen state
            setIsXlScreen(isXl);
            
            // Show sidebar by default on XL screens, hide on smaller screens
            setIsSidebarVisible(isXl);
            
            // Directly manipulate content margin based on visibility and screen size
            const contentContainer = document.querySelector('.content-container');
            if (contentContainer) {
                if (isXl) {
                    contentContainer.style.marginLeft = '280px';
                } else {
                    contentContainer.style.marginLeft = '0';
                }
            }
        };

        // Initialize on mount
        handleResize();

        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleLogout = async () => {
        try {
            console.log("Logout initiated");
            // Make sure this endpoint matches your Laravel route
            const response = await api.post('logout', {}, { 
                withCredentials: true,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });
            
            console.log("Logout response:", response.data);
            
            // Clear user data
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            localStorage.removeItem('isLoggedIn');
            
            // Clear authorization header
            api.defaults.headers.common['Authorization'] = '';
            
            // Navigate to home/login page
            setHeaderText("Dashboard");
             sessionStorage.setItem("headerText", "Dashboard");
            navigate('/');
        } catch (error) {
            console.error("Logout error:", error);
            // You might want to handle the error differently
            // Maybe still clear localStorage but show an error message
        }
    };
      
    const toggleSidebar = () => {
        const newState = !isSidebarVisible;
        setIsSidebarVisible(newState);
        
        // Get the content container element
        const contentContainer = document.querySelector('.content-container');
        
        // Adjust the margin of the content container based on sidebar visibility
        if (contentContainer && !isXlScreen) {
            contentContainer.style.marginLeft = newState ? '280px' : '0';
        }
    };
    
    return (
        <div id="defaultLayout" className="flex h-screen">
            <div className="layout-container"></div>
        
            {/* Sidebar with proper width handling */}
            <aside 
                ref={sidebarRef}
                className={`sidebar-container fixed z-20 h-full shadow-lg transform transition-all duration-300 bg-[#1d2e28] xl:w-[280px] ${
                    isSidebarVisible ? "w-[280px] translate-x-0" : "w-0 -translate-x-full"
                }`}
                
            >
                <img src={logo} alt="Finance Monitoring Logo" className="logo" />
                <h1 className="sidebar-title">Finance Monitoring</h1>
                <div className="sidebar-links">
                   
                <Link to="/super-admin-dashboard" onClick={() => { handleHeaderChange("Dashboard"); }}>
                    <span className="flex items-center text-white text-xl font-semibold py-2 px-4 rounded-md hover:bg-blue-500 hover:text-white transition-all duration-300 ease-in-out">
                        <HomeIcon className="h-7 w-7" style={{marginRight:"17px"}} /> {/* Icon for Dashboard */}
                        Dashboard
                    </span>
                </Link>

                <Link to="/super-admin-transaction" onClick={() => { handleHeaderChange("Add Transaction"); }}>
                    <span className="flex items-center text-white text-xl font-semibold py-2 px-4 rounded-md hover:bg-blue-500 hover:text-white transition-all duration-300 ease-in-out">
                        <PlusIcon className="h-7 w-7" style={{marginRight:"17px"}} /> {/* Icon for Add Transaction */}
                        Add Transaction
                    </span>
                </Link>

                <Link to="/super-admin-transaction-history" onClick={() => { handleHeaderChange("Transaction History"); }}>
                    <span className="flex items-center text-white text-xl font-semibold py-2 px-4 rounded-md hover:bg-blue-500 hover:text-white transition-all duration-300 ease-in-out">
                        <ListBulletIcon className="h-7 w-7" style={{marginRight:"17px"}} /> {/* Icon for Transaction List */}
                        Transaction List
                    </span>
                </Link>
                
                        <Link to="/super-admin-user-lists" onClick={() => handleHeaderChange("User Management")}>
                            <span className="flex items-center text-white text-lg font-semibold py-2 px-4 rounded-md hover:bg-blue-500 hover:text-white transition-all duration-300 ease-in-out">
                                <UsersIcon className="h-7 w-7" style={{ marginRight: '17px' }} />
                                User Management
                            </span>
                        </Link>
                    

                </div>
                  
                {userData && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-amber-600/40">
                        <div className="flex items-center px-4 py-2">
                            <div className="w-10 h-10 rounded-full bg-white text-[#333333] flex items-center justify-center font-bold mr-3 cursor-default">
                                {userData.name ? userData.name.charAt(0) : 'U'}
                            </div>
                            <div className="flex flex-col cursor-default">
                                <span className="text-[#333333] font-medium">{userData.name || 'User'}</span>
                                {userData.position && (
                                    <span className="text-[#444444]/80 text-xs">{userData.position}</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </aside>

            <div className="content-container flex-1 xl:h-[500px] transition-all duration-300">
                <header className="header-container flex items-center w-full px-4">
                    <div className="flex items-center w-full">
                        {/* Sidebar Toggle - hidden on XL screens */}
                        <button 
                            className="sidebar-toggle md:px-3 py-2 rounded focus:outline-none xl:hidden" 
                            onClick={toggleSidebar}
                            aria-label="Toggle sidebar"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        {/* Header Text - Left aligned with adjustment for XL screens */}
                        <div className="header-text ml-4 sm:ml-8 md:ml-11 lg:ml-16 xl:ml-4 w-[70px]">
                            {headerText}
                        </div>
                        
                        {/* Logout Button - Right aligned */}
                        <button
                            className="logout-btn w-[70px] md:w-[115px] right-8 flex items-center gap-2"
                            onClick={handleLogout}
                        >
                            {/* Show only on small screens */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-6 h-6 block sm:hidden"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m4.5-3H9m7.5-3 3 3m0 0-3 3"
                                />
                            </svg>

                            {/* Show only on larger screens */}
                            <span className="text hidden sm:block">Logout</span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main >
                    <Outlet context={{ userData }} />
                </main>
            </div>
        </div>
    );
}

export default SuperAdminLayout;