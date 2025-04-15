import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import api from '../axiosConfig';
import '../styles/dashboard.css';

const Dashboard = () => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [totals, setTotals] = useState({ total_income: 0, total_cost: 0, net_income: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("charts");
  const [activePeriod, setActivePeriod] = useState("monthly");
  
  useEffect(() => {
    fetchDashboardData(activePeriod);
  }, [activePeriod]);
  
  const fetchDashboardData = async (period = 'monthly') => {
    try {
      setLoading(true);
  
      // Ensure authentication
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }
  
      // Fetch financial data with time period filter
      const { data: monthlyDataRes } = await api.get('dashboard/financial-data', {
        params: { period: period }
      });
  
      if (monthlyDataRes?.monthly_data?.length) {
        setMonthlyData(
          monthlyDataRes.monthly_data.map(item => ({
            month: item.month,
            total_income: parseFloat(item.total_income) || 0,
            total_cost: parseFloat(item.total_cost) || 0,
            net_income: (parseFloat(item.total_income) || 0) - (parseFloat(item.total_cost) || 0),
          }))
        );
  
        // Fix: Ensure values are properly converted to numbers
        setTotals({
          total_income: parseFloat(monthlyDataRes.summary?.total_income) || 0,
          total_cost: parseFloat(monthlyDataRes.summary?.total_cost) || 0,
          net_income: (parseFloat(monthlyDataRes.summary?.total_income) || 0) - 
                    (parseFloat(monthlyDataRes.summary?.total_cost) || 0),
        });
      }
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
  
      
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (period) => {
    setActivePeriod(period);
  };

  if (loading) return <div className="loading">Loading dashboard data...</div>;
  if (error) return (
    <div className="error-container">
      <div className="error-message">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.href = '/'}>Return to Login</button>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container flex flex-col items-center justify-center min-h-screen">
      {/* Period Filter */}
      <div className="period-filter w-full max-w-4xl px-4 mb-6">
        <div className="flex gap-4 justify-center">
          <button 
            className={`px-4 py-2 rounded ${activePeriod === 'monthly' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => handlePeriodChange('monthly')}
          >
            Monthly
          </button>
          <button 
            className={`px-4 py-2 rounded ${activePeriod === 'quarterly' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => handlePeriodChange('quarterly')}
          >
            Quarterly
          </button>
          <button 
            className={`px-4 py-2 rounded ${activePeriod === 'yearly' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => handlePeriodChange('yearly')}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="cards-container flex flex-wrap justify-center gap-24 w-full max-w-5xl px-4 my-6">
        {/* Total Income */}
        <div className="card w-full md:w-[350px] bg-white p-4 rounded shadow xl:[900px]">
          <div className="card-header flex justify-between items-center">
            <span>Total Income</span>
            <span className="text-green-500 text-xl">₱</span>
          </div>
          <div className="card-value text-lg font-semibold text-black">
            {totals.total_income?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? "0.00"}
          </div>
        </div>

        {/* Total Expenses */}
        <div className="card w-full md:w-[350px] gap-7 bg-white p-4 rounded shadow">
          <div className="card-header flex justify-between items-center">
            <span>Total Expenses</span>
            <TrendingDown className="icon text-red-500" />
          </div>
          <div className="card-value text-lg font-semibold text-black">
            {totals.total_cost?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? "0.00"}
          </div>
        </div>

        {/* Net Income */}
        <div className="card w-full md:w-[350px] bg-white p-4 rounded shadow">
          <div className="card-header flex justify-between items-center">
            <span>Net Income</span>
            <TrendingUp className="icon text-blue-500" />
          </div>
          <div className="card-value text-lg font-semibold text-black">
            {totals.net_income?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? "0.00"}
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {view === "charts" && (
        <div className="chart-container w-[1100px] bg-white rounded-2xl h-36">
          <h2 className='text-sm mb-2 mt-3.5'>{activePeriod.charAt(0).toUpperCase() + activePeriod.slice(1)} Financial Overview</h2>
          <ResponsiveContainer width="100%" height={450}>
            <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fill: "#333", fontSize: 12 }} />
              <YAxis tick={{ fill: "#333", fontSize: 12 }} />
              <Tooltip formatter={(value) => `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
              <Legend />
              <Line type="monotone" dataKey="total_income" stroke="#22c55e" strokeWidth={3} />
              <Line type="monotone" dataKey="total_cost" stroke="#ef4444" strokeWidth={3} />
              <Line type="monotone" dataKey="net_income" stroke="#3b82f6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default Dashboard;