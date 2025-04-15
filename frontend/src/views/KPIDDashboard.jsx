import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

function KPIDashboard({ reportData, monthlyData }) {
  const [showKPIDetails, setShowKPIDetails] = useState(false);
  const [showKPISummary, setShowKPISummary] = useState(false);

  if (!reportData || !reportData.kpiMetrics) {
    return <p>Loading KPI data...</p>;
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
    <div className="report-section w-full max-w-6xl mx-auto  px-4 md:w-[300px] h-[470px] lg:ml:[200px] xl:h-[600px] overflow-y-auto ">
      <div className="report-header">
        <h2>Key Performance Indicators</h2>
        <p>Tracking critical financial metrics and ratios</p>
      </div>

      <div className="report-body">
        <div className="button-group">
          <button className="toggle-button gap-3.5" onClick={() => {
            setShowKPIDetails(!showKPIDetails);
            setShowKPISummary(false);
          }}>
            {showKPIDetails ? 'Back to Chart' : 'View Details'}
          </button>
          <button className="toggle-button" onClick={() => {
            setShowKPISummary(!showKPISummary);
            setShowKPIDetails(!showKPISummary);
          }}>
            {showKPISummary ? 'Hide Summary' : 'Summary KPI'}
          </button>
        </div>

        {showKPIDetails && !showKPISummary && (
          <div className="kpi-grid">
            {/* Profitability Section */}
            <div className="kpi-card">
              <div className="kpi-header"><h3>Profitability</h3></div>
              <div className="kpi-metrics">
                {[
                  { name: 'Profit Margin', value: reportData.kpiMetrics.profitMargin, threshold: 15, formula: 'Net Income / Revenue' },
                  { name: 'Expense Ratio', value: reportData.kpiMetrics.expenseRatio, threshold: 75, formula: 'Expenses / Revenue', invert: true },
                  { name: 'Return on Assets', value: reportData.kpiMetrics.returnOnAssets, threshold: 5, formula: 'Net Income / Total Assets' },
                  { name: 'Return on Equity', value: reportData.kpiMetrics.returnOnEquity, threshold: 10, formula: 'Net Income / Total Equity' }
                ].map(({ name, value, threshold, formula, invert }) => (
                  <div className="kpi-metric" key={name}>
                    <span className="metric-name">{name}</span>
                    <span className={`metric-value ${invert ? value <= threshold : value >= threshold ? 'positive' : 'warning'}`}>
                      {formatPercentage(value)}
                    </span>
                    <span className="metric-description">{formula}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Liquidity Section */}
            <div className="kpi-card">
              <div className="kpi-header"><h3>Liquidity</h3></div>
              <div className="kpi-metrics">
                {[
                  { name: 'Current Ratio', value: reportData.kpiMetrics.currentRatio, threshold: 1.5, formula: 'Current Assets / Current Liabilities' },
                  { name: 'Quick Ratio', value: reportData.kpiMetrics.quickRatio, threshold: 1, formula: '(Cash + Receivables) / Current Liabilities' }
                ].map(({ name, value, threshold, formula }) => (
                  <div className="kpi-metric" key={name}>
                    <span className="metric-name">{name}</span>
                    <span className={`metric-value ${value >= threshold ? 'positive' : 'warning'}`}>
                      {value}
                    </span>
                    <span className="metric-description">{formula}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Solvency Section */}
            <div className="kpi-card">
              <div className="kpi-header"><h3>Solvency</h3></div>
              <div className="kpi-metrics">
                <div className="kpi-metric">
                  <span className="metric-name">Debt to Equity</span>
                  <span className={`metric-value ${reportData.kpiMetrics.debtToEquity <= 1.5 ? 'positive' : 'negative'}`}>
                    {reportData.kpiMetrics.debtToEquity}
                  </span>
                  <span className="metric-description">Total Debt / Total Equity</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!showKPIDetails && (
          <div className="kpi-details">
            {[
              { title: 'Monthly Income Trend', key: 'totalIncome', color: '#22c55e' },
              { title: 'Monthly Expense Trend', key: 'totalExpenses', color: '#ef4444' }
            ].map(({ title, key, color }) => (
              <div className="kpi-card" key={title}>
                <div className="kpi-header"><h3>{title}</h3></div>
                <div className="kpi-chart">
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fill: '#333', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#333', fontSize: 10 }} />
                      <Tooltip formatter={(value) => [`₱${value.toLocaleString()}`, '']} />
                      <Area type="monotone" dataKey={key} stroke={color} fill={color} fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        )}

        {showKPISummary && (
          <div className="kpi-summary">
            <h3>KPI Summary</h3>
            <p><strong>Financial Health Assessment:</strong> 
              {reportData.kpiMetrics.profitMargin >= 15 && reportData.kpiMetrics.currentRatio >= 1.5 && reportData.kpiMetrics.debtToEquity <= 1.5
                ? 'Strong' : 'Needs Attention'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default KPIDashboard;
