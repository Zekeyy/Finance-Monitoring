import { createBrowserRouter } from "react-router-dom";
import Login from "./views/Login.jsx";
//import Register from "./views/Register.jsx";
import DefaultLayout from "./components/DefaultLayout.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import SecretaryDashboard from "./views/SecretaryDashboard.jsx";

import AddTransaction from "./views/AddTransaction.jsx";
import Register from "./views/Register.jsx";
import TransactionHistory from "./views/TransactionHistory.jsx";
import Dashboard from "./views/Dashboard.jsx";
import FinancialReports from "./views/FinancialReports.jsx";
import UserList from "./views/userList.jsx";
import SuperAdminLayout from "./components/SuperAdminLayout.jsx";

const ErrorPage = () => (
    <div>
        <h1>404 Not Found</h1>
        <p>The page you are looking for does not exist.</p>
    </div>
);

const router = createBrowserRouter([
    {
        path: "/",
        element: <Login />,
    },
    {
        path: "/register",
        element: <Register />,
    },
   
    //{
    //    path: "/register",
   //     element: <Register />,
   // },
   // {
   //     path: "/forgot-password",
   //     element: <ForgotPassword />,
    //},
    //{
    //    path: "/resetpassword",
    //    element: <ResetPassword />,
   // },
    {
        path: "/",
        element: <AdminLayout />,
        children: [
            {
                path: "admin-dashboard",
                element: <FinancialReports />,
            },
            {
                path: "transaction-histories",
                element: <TransactionHistory />,
            },
            {
                path: "financial-reports-data",
                element: <FinancialReports />,
            },
            {
                path: "user-list",
                element: <UserList />,
            },
          
           
        ],
        errorElement: <ErrorPage />,
    },
    {
        path: "/",
        element: <DefaultLayout />,
        children: [
            
            {
                path: "dashboard",
                element: <FinancialReports />,
            },
            
            {
                path: "transaction",
                element: <AddTransaction />,
            },
            {
                path: "transaction-history",
                element: <TransactionHistory />,
            },
            {
                path: "financial-reports",
                element: <FinancialReports />,
            },
            {
                path: "user-lists",
                element: <UserList />,
            },
          
           
        ],
        errorElement: <ErrorPage />,
    },
    {
        path: "/",
        element: <SuperAdminLayout />,
        children: [
            
            {
                path: "super-admin-dashboard",
                element: <FinancialReports />,
            },
            
            {
                path: "super-admin-transaction",
                element: <AddTransaction />,
            },
            {
                path: "super-admin-transaction-history",
                element: <TransactionHistory />,
            },
            {
                path: "super-admin-financial-reports",
                element: <FinancialReports />,
            },
            {
                path: "super-admin-user-lists",
                element: <UserList />,
            },
          
           
        ],
        errorElement: <ErrorPage />,
    },

]);

export default router;
