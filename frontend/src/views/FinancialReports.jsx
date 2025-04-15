import React, { useState, useEffect, useRef } from 'react';

import { 
  DollarSign, TrendingUp, TrendingDown, PieChart as PieChartIcon,
  BarChart2, AlertTriangle, FileText, Activity, ArrowUpRight, ArrowDownRight,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import api from '../axiosConfig';
import '../styles/financialReports.css';
import Budget from './Budget';
import VarianceAnalysis from './VarianceAnalysis';
import CashFlowReport from './CashFlowReports';
import KPIDashboard from './KPIDDashboard';
import IncomeStatement from './IncomeStatement';

const FinancialReports = () => {
  // State management
  const [activeReport, setActiveReport] = useState('income');
  const [timeframe, setTimeframe] = useState('Monthly');
  const [reportData, setReportData] = useState({
    incomeStatement: [],
    cashFlow: [],
   // budgetVsActual: [],
    varianceAnalysis: [],
    kpiMetrics: {
      profitMargin: 0,
      expenseRatio: 0,
      currentRatio: 0,
      quickRatio: 0,
      debtToEquity: 0,
      returnOnAssets: 0,
      returnOnEquity: 0
    }
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [yearToDate, setYearToDate] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netIncome: 0
  });
  
  // Common period index for all summary cards
  const [currentPeriodIndex, setCurrentPeriodIndex] = useState(null);
  
  // Periods data array
  const [periodsData, setPeriodsData] = useState([]);
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a64dff', '#ff4d4d'];

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Check authentication
        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('Authentication required');
        }
        
        // Fetch monthly data from your existing endpoint
        const monthlyResponse = await api.get(`financial-report/monthly-data?range=${timeframe}`);

        if (monthlyResponse.data && Array.isArray(monthlyResponse.data)) {
          const formattedMonthlyData = monthlyResponse.data.map(item => ({
            month: new Date(item.month + '-01').toLocaleDateString('default', { month: 'long', year: 'numeric' }),
            rawMonth: item.month,
            totalIncome: parseFloat(item.total_income || 0),
            totalExpenses: parseFloat(item.total_cost || 0),
            netIncome: parseFloat(item.total_income || 0) - parseFloat(item.total_cost || 0)
          }));
          
          setMonthlyData(formattedMonthlyData);
          
          // Calculate year to date totals
          const ytd = formattedMonthlyData.reduce((acc, item) => {
            return {
              totalIncome: acc.totalIncome + item.totalIncome,
              totalExpenses: acc.totalExpenses + item.totalExpenses,
              netIncome: acc.netIncome + item.netIncome
            };
          }, { totalIncome: 0, totalExpenses: 0, netIncome: 0 });
          
          setYearToDate(ytd);
        }
      } catch (err) {
        console.error('Reports data fetch error:', err);
        setError(err.message || 'Failed to load reports data');
        
        if (err.response && err.response.status === 401) {
          window.location.href = '/';
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, [timeframe]);

  useEffect(() => {
    if (monthlyData.length > 0) {
      const transformedData = transformDataByTimeframe(monthlyData, timeframe);
      
      // Set periods data
      setPeriodsData(transformedData);
      
      // Set current period to the most recent by default
      setCurrentPeriodIndex(transformedData.length - 1);
      
      // Process data for reports
      processReportData(transformedData);
    }
  }, [timeframe, monthlyData]);

  const transformDataByTimeframe = (monthlyData, timeframe) => {
    if (timeframe === 'Monthly') {
      return monthlyData;
    }
    
    if (timeframe === 'Quarterly') {
      const quarterlyData = [];
      const quarters = {};
      
      // Group months into quarters
      monthlyData.forEach(item => {
        const date = new Date(item.rawMonth + '-01');
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        const year = date.getFullYear();
        const quarterKey = `${year}-Q${quarter}`;
        
        if (!quarters[quarterKey]) {
          quarters[quarterKey] = {
            month: `Q${quarter} ${year}`,
            rawMonth: quarterKey,
            totalIncome: 0,
            totalExpenses: 0,
            netIncome: 0
          };
        }
        
        quarters[quarterKey].totalIncome += item.totalIncome;
        quarters[quarterKey].totalExpenses += item.totalExpenses;
        quarters[quarterKey].netIncome += item.netIncome;
      });
      
      // Convert object to array
      Object.keys(quarters).forEach(key => {
        quarterlyData.push(quarters[key]);
      });
      
      return quarterlyData.sort((a, b) => a.rawMonth.localeCompare(b.rawMonth));
    }
    
    if (timeframe === 'Yearly') {
      const yearlyData = [];
      const years = {};
      
      // Group months into years
      monthlyData.forEach(item => {
        const date = new Date(item.rawMonth + '-01');
        const year = date.getFullYear();
        const yearKey = year.toString();
        
        if (!years[yearKey]) {
          years[yearKey] = {
            month: yearKey,
            rawMonth: yearKey,
            totalIncome: 0,
            totalExpenses: 0,
            netIncome: 0
          };
        }
        
        years[yearKey].totalIncome += item.totalIncome;
        years[yearKey].totalExpenses += item.totalExpenses;
        years[yearKey].netIncome += item.netIncome;
      });
      
      // Convert object to array
      Object.keys(years).forEach(key => {
        yearlyData.push(years[key]);
      });
      
      return yearlyData.sort((a, b) => a.rawMonth.localeCompare(b.rawMonth));
    }
    
    return monthlyData;
  };

  // Navigation functions for all cards (using a common index)
  const handlePrevPeriod = () => {
    if (currentPeriodIndex > 0) {
      setCurrentPeriodIndex(currentPeriodIndex - 1);
    }
  };

  const handleNextPeriod = () => {
    if (currentPeriodIndex < periodsData.length - 1) {
      setCurrentPeriodIndex(currentPeriodIndex + 1);
    }
  };

  const processReportData = (monthlyData) => {
    const incomeStatement = monthlyData.map(item => ({
      ...item,
      totalIncome: Math.max(0, item.totalIncome), // Ensure totalIncome is not negative
      totalExpenses: Math.max(0, item.totalExpenses), // Ensure totalExpenses is not negative
      netIncome: Math.max(0, item.netIncome), // Ensure netIncome is not negative
      grossProfit: Math.max(0, item.totalIncome * 0.7),
      operatingExpenses: Math.max(0, item.totalExpenses * 0.6),
      operatingIncome: Math.max(0, (item.totalIncome * 0.7) - (item.totalExpenses * 0.6)),
      otherExpenses: Math.max(0, item.totalExpenses * 0.4),
    }));
    const currentMonth = new Date().getMonth();
  
    const cashFlow = monthlyData.map(item => {
      const totalIncome = Math.max(0, item.totalIncome);
      const totalExpenses = Math.max(0, item.totalExpenses);
      const netIncome = Math.max(0, item.netIncome);
      
      // Apply Math.max(0, ...) to avoid negative values in all cash flows
      const operatingCashFlow = Math.max(0, netIncome * 1.1); // Operating cash flow, should be positive or zero
      const investingCashFlow = Math.max(0, -totalIncome * 0.2); // Investing cash flow, should be positive or zero
      const financingCashFlow = Math.max(0, -totalIncome * 0.1); // Financing cash flow, should be positive or zero
    
      // Prevent netCashFlow from being negative
      let netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;
      netCashFlow = Math.max(0, netCashFlow); // If it's negative, set it to 0
    
      return {
        ...item,
        totalIncome,
        totalExpenses,
        netIncome,
        operatingCashFlow,
        investingCashFlow,
        financingCashFlow,
        netCashFlow
      };
    });
    
    const varianceFactor = 0.1; // 10% variance

   // const budgetVsActual = monthlyData.map(item => {
   //   const budgetedIncome = item.totalIncome * (1 + varianceFactor);
     // const budgetedExpenses = item.totalExpenses * (1 + varianceFactor);

    //  return {
    //    ...item,
     ////   totalIncome: Math.max(0, item.totalIncome),
      //  totalExpenses: Math.max(0, item.totalExpenses),
     //   budgetedIncome: Math.max(0, budgetedIncome),
     //   budgetedExpenses: Math.max(0, budgetedExpenses),
     //   incomeVariance: Math.abs(item.totalIncome - budgetedIncome),
     //   expensesVariance: Math.abs(item.totalExpenses - budgetedExpenses),
     // };
   // });

    const varianceAnalysis = monthlyData.map((item, index, array) => {
      const prevMonth = index > 0 ? array[index - 1] : null;
      return {
        ...item,
        incomeChangePercent: prevMonth ? ((item.totalIncome - prevMonth.totalIncome) / prevMonth.totalIncome) * 100 : 0,
        expensesChangePercent: prevMonth ? ((item.totalExpenses - prevMonth.totalExpenses) / prevMonth.totalExpenses) * 100 : 0,
        netIncomeChangePercent: prevMonth ? ((item.netIncome - prevMonth.netIncome) / prevMonth.netIncome) * 100 : 0
      };
    });

    // KPI Metrics - Ensure no negative values
    const kpiMetrics = {
      profitMargin: Math.max(0, (yearToDate.netIncome / yearToDate.totalIncome) * 100),
      expenseRatio: Math.max(0, (yearToDate.totalExpenses / yearToDate.totalIncome) * 100),
    };
  
    setReportData({
      incomeStatement,
      cashFlow,
     // budgetVsActual,
      varianceAnalysis,
      kpiMetrics
    });
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null) {
      return '₱0.00';
    }
    return '₱' + value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  const formatPercentage = (value) => {
    if (value === undefined || value === null) {
      return '0.00%';
    }
    return value.toFixed(2) + '%';
  };

 // Calculate profit margin for a specific period
const calculateProfitMargin = (income, expenses) => {
  if (!income || income === 0) return 0;
  const netIncome = income - expenses;
  // Use Math.max to ensure the profit margin is never negative
  return Math.max(0, (netIncome / income) * 100);
};
  
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
    <div className="reports-container p-4 md:ml-[200px] xl:ml-[160px] min-h-screen max-h-screen overflow-y-auto">
      <div className="reports-header mb-4">
        <div className="reports-controls flex flex-col md:flex-row md:justify-between items-center gap-4">
          {/* Report Selector */}
          <div className="report-selector w-full md:w-auto flex justify-center">
            <div className="hidden md:flex flex-wrap gap-2">
              <button className={`px-4 py-2 border rounded ${activeReport === "income" ? "bg-gray-800 text-white" : "bg-gray-200"}`} onClick={() => setActiveReport("income")}>
                Income Statement
              </button>
            {/** <button className={`px-4 py-2 border rounded ${activeReport === "cashflow" ? "bg-gray-800 text-white" : "bg-gray-200"}`} onClick={() => setActiveReport("cashflow")}>
                Cash Flow
              </button> */} 
              <button className={`px-4 py-2 border rounded ${activeReport === "budget" ? "bg-gray-800 text-white" : "bg-gray-200"}`} onClick={() => setActiveReport("budget")}>
                Budget vs Actual
              </button>
           {/*  <button className={`px-4 py-2 border rounded ${activeReport === "variance" ? "bg-gray-800 text-white" : "bg-gray-200"}`} onClick={() => setActiveReport("variance")}>
                Variance Analysis
              </button>
              <button className={`px-4 py-2 border rounded ${activeReport === "kpi" ? "bg-gray-800 text-white" : "bg-gray-200"}`} onClick={() => setActiveReport("kpi")}>
                KPI Dashboard
              </button>
              */}
            </div>
            {/* Dropdown for Mobile */}
            <div className="w-full flex justify-center mt-2">
              <select
                className="block md:hidden w-[85%] max-w-[280px] border rounded p-2 text-sm"
                value={activeReport}
                onChange={(e) => setActiveReport(e.target.value)}
              >
                <option value="income">Income Statement</option>
              {/**<option value="cashflow">Cash Flow</option> */}  
                <option value="budget">Budget vs Actual</option>
                
              </select>
            </div>
          </div>
          {/* Timeframe Selector */}
          <div className="timeframe-selector w-full md:w-auto">
            <select className="border rounded p-2 w-full md:w-auto cursor-pointer" value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Period indicator at the top */}
      <div className="period-indicator text-[#44444] text-lg font-medium text-center mb-4">
        {currentPeriodIndex !== null && periodsData[currentPeriodIndex] 
          ? periodsData[currentPeriodIndex].month 
          : ''} ({timeframe})
      </div>
      
      {/* Summary Cards with navigation controls on the sides */}
      <div className="flex items-center">
        {/* Left navigation button */}
        <button 
          onClick={handlePrevPeriod} 
          disabled={currentPeriodIndex === 0 || currentPeriodIndex === null}
          className={`mr-2 p-2 border rounded flex items-center justify-center ${currentPeriodIndex === 0 || currentPeriodIndex === null ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-600 hover:bg-gray-100 cursor-pointer'}`}
        >
         <ChevronLeft size={50} style={{ color: '#444444', marginRight: '20px' }} />

        </button>
        
        {/* Summary Cards */}
        <div className="summary-cards grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4 flex-grow cursor-default">
          {/* Income Card */}
          <div className="summary-card p-4 border rounded shadow relative">
            <div className="card-header flex justify-between items-center">
              <span>Total Income</span>
              <div className="card-icon positive">
                <span className="pesos-green">₱</span>
              </div>
            </div>
            <div className="card-value text-xl font-bold">
              {currentPeriodIndex !== null && periodsData[currentPeriodIndex] 
                ? formatCurrency(periodsData[currentPeriodIndex].totalIncome) 
                : '₱0.00'}
            </div>
          </div>
          
          {/* Expenses Card */}
          <div className="summary-card p-4 border rounded shadow relative">
            <div className="card-header flex justify-between items-center">
              <span>Total Expenses</span>
              <div className="card-icon negative">
                <TrendingDown size={20} />
              </div>
            </div>
            <div className="card-value text-xl font-bold">
              {currentPeriodIndex !== null && periodsData[currentPeriodIndex] 
                ? formatCurrency(periodsData[currentPeriodIndex].totalExpenses) 
                : '₱0.00'}
            </div>
          </div>
          
          {/* Net Income Card */}
          <div className="summary-card p-4 border rounded shadow relative ">
            <div className="card-header flex justify-between items-center">
              <span>Net Income</span>
              <div className={`card-icon ${currentPeriodIndex !== null && periodsData[currentPeriodIndex] && periodsData[currentPeriodIndex].netIncome >= 0 ? "positive" : "negative"}`}>
                {currentPeriodIndex !== null && periodsData[currentPeriodIndex] && periodsData[currentPeriodIndex].netIncome >= 0 
                  ? <TrendingUp size={20} /> 
                  : <TrendingDown size={20} />}
              </div>
            </div>
            <div className="card-value text-xl font-bold">
              {currentPeriodIndex !== null && periodsData[currentPeriodIndex] 
                ? formatCurrency(periodsData[currentPeriodIndex].netIncome) 
                : '₱0.00'}
            </div>
            <div className="card-trend">
              {currentPeriodIndex !== null && periodsData[currentPeriodIndex] && periodsData[currentPeriodIndex].netIncome >= 0 ? (
                <span className="positive flex items-center">
                  <ArrowUpRight size={16} className="mr-1" /> Profit
                </span>
              ) : (
                <span className="negative flex items-center">
                  <ArrowDownRight size={16} className="mr-1" /> Loss
                </span>
              )}
            </div>
          </div>
          
          {/* Profit Margin Card */}
          <div className="summary-card p-4 border rounded shadow relative">
            <div className="card-header flex justify-between items-center">
              <span>Profit Margin</span>
              <div className={`card-icon ${
                currentPeriodIndex !== null && periodsData[currentPeriodIndex] 
                  ? (calculateProfitMargin(
                      periodsData[currentPeriodIndex].totalIncome, 
                      periodsData[currentPeriodIndex].totalExpenses
                    ) >= 15 ? "positive" : "warning") 
                  : "warning"
              }`}>
                <Activity size={20} />
              </div>
            </div>
            <div className="card-value text-xl font-bold">
              {currentPeriodIndex !== null && periodsData[currentPeriodIndex] 
                ? formatPercentage(calculateProfitMargin(
                    periodsData[currentPeriodIndex].totalIncome, 
                    periodsData[currentPeriodIndex].totalExpenses
                  )) 
                : '0.00%'}
            </div>
            <div className="card-trend">
              {currentPeriodIndex !== null && periodsData[currentPeriodIndex] && 
                calculateProfitMargin(
                  periodsData[currentPeriodIndex].totalIncome, 
                  periodsData[currentPeriodIndex].totalExpenses
                ) >= 15 ? (
                <span className="positive">Healthy</span>
              ) : (
                <span className="warning">Needs Attention</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Right navigation button */}
        <button 
          onClick={handleNextPeriod} 
          disabled={currentPeriodIndex === periodsData.length - 1 || currentPeriodIndex === null}
          className={`ml-2 p-2 border rounded flex items-center justify-center ${currentPeriodIndex === periodsData.length - 1 || currentPeriodIndex === null ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-600 hover:bg-gray-100 cursor-pointer'}`}
        >
          <ChevronRight size={50} style={{ color: '#444444', marginLeft: '20px' }} />

        </button>
      </div>
      
    
      
      {/* Reports */}
      <div className="mt-6">
        {activeReport === "income" && <IncomeStatement reportData={reportData} yearToDate={yearToDate} />}
        {activeReport === "cashflow" && <CashFlowReport reportData={reportData} />}
        {activeReport === "budget" && <Budget timeframe={timeframe} />}
        {activeReport === "variance" && <VarianceAnalysis reportData={reportData} />}
        {activeReport === "kpi" && <KPIDashboard reportData={reportData} monthlyData={monthlyData} />}
      </div>
    </div>
  );
};

export default FinancialReports;