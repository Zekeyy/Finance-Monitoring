import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

function CashFlowReport({ reportData }) {
  const [showCashFlowDetails, setShowCashFlowDetails] = useState(false);

  if (!reportData || !reportData.cashFlow) {
    return <p>Loading cash flow data...</p>;
  }
  const formatCurrency = (value) => {
    if (value === undefined || value === null) {
      return '₱0.00';
    }
    return '₱' + value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
 
  return (
<div className="report-section w-full max-w-6xl mx-auto px-4 md:w-[300px] h-[450px] md:h-[450px] xl:h-[570px] overflow-y-auto">
<div className="report-header">
        <h2>Cash Flow Statement</h2>
        <p>Tracking cash inflows and outflows</p>
      </div>

      <div className="report-body">
        <button 
          className="toggle-button cursor-pointer" 
          onClick={() => setShowCashFlowDetails(!showCashFlowDetails)}
        >
          {showCashFlowDetails ? 'Back to Chart' : 'View Details'}
        </button>

        {/* Cash Flow Trends Chart */}
        {!showCashFlowDetails && (
          <div className="chart-container">
            <h3>Cash Flow Trends</h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={reportData.cashFlow}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fill: '#333', fontSize: 12 }} />
                <YAxis tick={{ fill: '#333', fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => ['₱' + value.toLocaleString(), '']}
                  contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd' }} 
                />
                <Legend />
                <Area type="monotone" dataKey="operatingCashFlow" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} name="Operating" />
                <Area type="monotone" dataKey="investingCashFlow" stackId="2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Investing" />
                <Area type="monotone" dataKey="financingCashFlow" stackId="3" stroke="#f97316" fill="#f97316" fillOpacity={0.6} name="Financing" />
                <Line type="monotone" dataKey="netCashFlow" stroke="#8b5cf6" strokeWidth={3} name="Net Cash Flow" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Cash Flow Details Table */}
        {showCashFlowDetails && (
          <div className="data-grid">
            <h3>Cash Flow Statement Details</h3>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Operating Cash Flow</th>
                  <th>Investing Cash Flow</th>
                  <th>Financing Cash Flow</th>
                  <th>Net Cash Flow</th>
                </tr>
              </thead>
              <tbody>
                {reportData.cashFlow.map((item, index) => (
                  <tr key={index}>
                    <td>{item.month}</td>
                    <td className="positive">{formatCurrency(item.operatingCashFlow)}</td>
                    <td className="negative">{formatCurrency(item.investingCashFlow)}</td>
                    <td className="negative">{formatCurrency(item.financingCashFlow)}</td>
                    <td className={item.netCashFlow >= 0 ? 'positive' : 'negative'}>
                      {formatCurrency(item.netCashFlow)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>Total</strong></td>
                  <td className="positive"><strong>{formatCurrency(
                    reportData.cashFlow.reduce((sum, item) => sum + item.operatingCashFlow, 0)
                  )}</strong></td>
                  <td className="negative"><strong>{formatCurrency(
                    reportData.cashFlow.reduce((sum, item) => sum + item.investingCashFlow, 0)
                  )}</strong></td>
                  <td className="negative"><strong>{formatCurrency(
                    reportData.cashFlow.reduce((sum, item) => sum + item.financingCashFlow, 0)
                  )}</strong></td>
                  <td className={
                    reportData.cashFlow.reduce((sum, item) => sum + item.netCashFlow, 0) >= 0 ? 'positive' : 'negative'
                  }><strong>{formatCurrency(
                    reportData.cashFlow.reduce((sum, item) => sum + item.netCashFlow, 0)
                  )}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default CashFlowReport;
