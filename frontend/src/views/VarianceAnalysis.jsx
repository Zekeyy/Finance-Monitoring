import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { AlertTriangle } from 'lucide-react';

function VarianceAnalysis({ reportData }) {
  const [showVarianceAnalysisDetails, setShowVarianceAnalysisDetails] = useState(false);
  const [showVarianceAlertDetails, setShowVarianceAlertDetails] = useState(false);

  if (!reportData || !reportData.varianceAnalysis) {
    return <p>Loading variance analysis data...</p>;
  }
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
  
 
  return (
    <div className="report-section w-full max-w-6xl mx-auto px-4 md:w-[300px] h-[470px]  xl:h-[600px] overflow-y-auto">
      <div className="report-header">
        <h2>Variance Analysis</h2>
        <p>Identifying and analyzing financial performance changes over time</p>
      </div>

      <div className="report-body">
        <button 
          className="toggle-button" 
          onClick={() => {
            setShowVarianceAnalysisDetails(!showVarianceAnalysisDetails);
            setShowVarianceAlertDetails(false);
          }}
        >
          {showVarianceAnalysisDetails ? 'Back to Chart' : 'View Details'}
        </button>

        <button 
          className="toggle-button" 
          onClick={() => {
            setShowVarianceAlertDetails(!showVarianceAlertDetails);
            setShowVarianceAnalysisDetails(true);
          }}
        >
          {showVarianceAlertDetails ? 'Back to Chart' : 'View Key Variance Alert'}
        </button>

        {/* Variance Chart */}
        {!showVarianceAnalysisDetails && (
          <div className="chart-container">
            <h3>Month-over-Month Percent Changes</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={reportData.varianceAnalysis.slice(1)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fill: '#333', fontSize: 12 }} />
                <YAxis tick={{ fill: '#333', fontSize: 12 }} />
                <Tooltip formatter={(value) => [value.toFixed(2) + '%', '']} contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd' }} />
                <Legend />
                <Line type="monotone" dataKey="incomeChangePercent" stroke="#22c55e" strokeWidth={2} name="Income % Change" />
                <Line type="monotone" dataKey="expensesChangePercent" stroke="#ef4444" strokeWidth={2} name="Expenses % Change" />
                <Line type="monotone" dataKey="netIncomeChangePercent" stroke="#3b82f6" strokeWidth={2} name="Net Income % Change" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Variance Analysis Details */}
        {showVarianceAnalysisDetails && (
          <div className="data-grid">
            <h3>Variance Analysis Details</h3>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Income</th>
                  <th>MoM Change %</th>
                  <th>Expenses</th>
                  <th>MoM Change %</th>
                  <th>Net Income</th>
                  <th>MoM Change %</th>
                </tr>
              </thead>
              <tbody>
                {reportData.varianceAnalysis.map((item, index) => (
                  <tr key={index}>
                    <td>{item.month}</td>
                    <td>{formatCurrency(item.totalIncome)}</td>
                    <td className={item.incomeChangePercent > 0 ? 'positive' : item.incomeChangePercent < 0 ? 'negative' : ''}>
                      {index === 0 ? '-' : formatPercentage(item.incomeChangePercent)}
                    </td>
                    <td>{formatCurrency(item.totalExpenses)}</td>
                    <td className={item.expensesChangePercent < 0 ? 'positive' : item.expensesChangePercent > 0 ? 'negative' : ''}>
                      {index === 0 ? '-' : formatPercentage(item.expensesChangePercent)}
                    </td>
                    <td>{formatCurrency(item.netIncome)}</td>
                    <td className={item.netIncomeChangePercent > 0 ? 'positive' : item.netIncomeChangePercent < 0 ? 'negative' : ''}>
                      {index === 0 ? '-' : formatPercentage(item.netIncomeChangePercent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Variance Alerts */}
        {showVarianceAlertDetails && (
          <div className="report-bodies">
            <div className="variance-alerts">
              <h3>Key Variance Alerts</h3>
              <div className="alerts-container">
                {reportData.varianceAnalysis.slice(1).map((item, index) => {
                  const alerts = [];

                  if (Math.abs(item.incomeChangePercent) > 10) {
                    alerts.push({
                      type: item.incomeChangePercent > 0 ? 'positive' : 'negative',
                      message: `${item.month}: Income ${item.incomeChangePercent > 0 ? 'increased' : 'decreased'} by ${Math.abs(item.incomeChangePercent).toFixed(1)}% from previous month`
                    });
                  }

                  if (Math.abs(item.expensesChangePercent) > 10) {
                    alerts.push({
                      type: item.expensesChangePercent < 0 ? 'positive' : 'negative',
                      message: `${item.month}: Expenses ${item.expensesChangePercent > 0 ? 'increased' : 'decreased'} by ${Math.abs(item.expensesChangePercent).toFixed(1)}% from previous month`
                    });
                  }

                  if (Math.abs(item.netIncomeChangePercent) > 15) {
                    alerts.push({
                      type: item.netIncomeChangePercent > 0 ? 'positive' : 'negative',
                      message: `${item.month}: Net Income ${item.netIncomeChangePercent > 0 ? 'increased' : 'decreased'} by ${Math.abs(item.netIncomeChangePercent).toFixed(1)}% from previous month`
                    });
                  }

                  return alerts.map((alert, alertIndex) => (
                    <div key={`${index}-${alertIndex}`} className={`alert ${alert.type}`}>
                      <AlertTriangle size={16} />
                      <span>{alert.message}</span>
                    </div>
                  ));
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VarianceAnalysis;
