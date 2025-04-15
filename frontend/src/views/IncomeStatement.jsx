import React, { useState } from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

function IncomeStatement({ reportData, yearToDate }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!reportData || !reportData.incomeStatement) {
    return <p>Loading income statement data...</p>;
  }
  const formatCurrency = (value) => {
    if (value === undefined || value === null) {
      return '₱0.00';
    }
    return '₱' + value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
 
  return (
    <div className="report-section w-full max-w-6xl mx-auto px-4 h-[540px] sm:h-[520px] overflow-y-auto md:w-[500px] h-[450px] md:h-[520px] overflow-y-auto xl:h-[540px]">
      <div className="report-header cursor-default">
        <h2>Income Statement</h2>
        <p>Showing revenue, expenses, and profits over time</p>
      </div>

      <div className="report-body">
        <button 
          className="toggle-button cursor-pointer" 
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Back to Chart' : 'View Details'}
        </button>

        {/* Chart View */}
        {!showDetails && (
          <div className="chart-container">
            <h3 className='cursor-default'>Revenue vs. Expenses</h3>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={reportData.incomeStatement}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fill: '#333', fontSize: 12 }} />
                <YAxis tick={{ fill: '#333', fontSize: 12 }} domain={[0, 'auto']} />
                <Tooltip 
                  formatter={(value) => ['₱' + value.toLocaleString(), '']}
                  contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd' }} 
                />
                <Legend />
                <Bar dataKey="totalIncome" fill="#22c55e" name="Revenue" />
                <Bar dataKey="totalExpenses" fill="#ef4444" name="Expenses" />
                <Line type="monotone" dataKey="netIncome" stroke="#3b82f6" strokeWidth={2} name="Net Income" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Details View */}
        {showDetails && (
          <div className="data-grid">
            <h3 className='cursor-default'>Income Statement Details</h3>
            <table className="report-table cursor-default">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Revenue</th>
                  <th>Expenses</th>
                  <th>Gross Profit</th>
                 {/**<th>Operating Expenses</th> */} 
                 {/**<th>Operating Income</th> */} 
                  <th>Net Income</th>
                </tr>
              </thead>
              <tbody>
                {reportData.incomeStatement.map((item, index) => (
                  <tr key={index}>
                    <td>{item.month}</td>
                    <td>{formatCurrency(item.totalIncome)}</td>
                    <td>{formatCurrency(item.totalExpenses)}</td>
                    <td>{formatCurrency(item.grossProfit)}</td>
                   {/** <td>{formatCurrency(item.operatingExpenses)}</td> */} 
                   {/**<td>{formatCurrency(item.operatingIncome)}</td> */} 
                    <td className={item.netIncome >= 0 ? 'positive' : 'negative'}>
                      {formatCurrency(item.netIncome)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>Total</strong></td>
                  <td><strong>{formatCurrency(yearToDate.totalIncome)}</strong></td>
                  <td><strong>{formatCurrency(yearToDate.totalExpenses)}</strong></td>
                  <td><strong>{formatCurrency(yearToDate.totalIncome * 0.7)}</strong></td>
                 {/**<td><strong>{formatCurrency(yearToDate.totalExpenses * 0.6)}</strong></td> */} 
                 {/**<td><strong>{formatCurrency((yearToDate.totalIncome * 0.7) - (yearToDate.totalExpenses * 0.6))}</strong></td> */} 
                  <td className={yearToDate.netIncome >= 0 ? 'positive' : 'negative'}>
                    <strong>{formatCurrency(yearToDate.netIncome)}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default IncomeStatement;
