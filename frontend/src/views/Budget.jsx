import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import { Plus, Save, Edit, X, FileText,Trash2 } from 'lucide-react';
import api from '../axiosConfig';
function Budget({ reportData, timeframe}) {
  const [showBudgetDetails, setShowBudgetDetails] = useState(false);
   // New state for notes modal
   const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
   const [selectedNotes, setSelectedNotes] = useState('');

  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetData, setBudgetData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    period_type: 'monthly', // matches database column
    year: new Date().getFullYear(),
    month: '', // will be converted to numeric 1-12 when saving
    budgeted_income: '', // matches database column
    budgeted_expenses: '', // matches database column
    notes: '',
   
  });

   // Method to open notes modal
   const openNotesModal = (notes) => {
    setSelectedNotes(notes);
    setIsNotesModalOpen(true);
  };

  // Method to close notes modal
  const closeNotesModal = () => {
    setSelectedNotes('');
    setIsNotesModalOpen(false);
  };
  // Fetch budget data when component mounts
  useEffect(() => {
    fetchBudgetData();
  }, [timeframe]);

  // Initialize budgetData with reportData when it changes
  useEffect(() => {
    if (reportData && reportData.budgetVsActual) {
      // Update budgetData while preserving any changes we might have made
      const mergedData = reportData.budgetVsActual.map(item => {
        // Try to find matching budget entry from our state
        const existingEntry = budgetData.find(budget => budget.month === item.month);
        if (existingEntry) {
          return { ...item, ...existingEntry };
        }
        return item;
      });
      
      setBudgetData(mergedData);
    }
  }, [reportData]);

  const fetchBudgetData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/budgets?timeframe=${timeframe}`);

      console.log('Budget API response:', response.data);

      const transformedData = response.data.map(budget => {
        const monthName = budget.period_type === 'monthly' && budget.month 
          ? new Date(2000, budget.month - 1, 1).toLocaleString('default', { month: 'long' })
          : null;
        return {
          id: budget.id,
          month: budget.period_type === 'monthly' ? `${monthName} ${budget.year}` : `Yearly ${budget.year}`,
          budgetedIncome: parseFloat(budget.budgeted_income) || 0,
          budgetedExpenses: parseFloat(budget.budgeted_expenses) || 0,
          notes: budget.notes || '',
          totalIncome: parseFloat(budget.actual_income || 0),  
          totalExpenses: parseFloat(budget.actual_expenses || 0),
          incomeVariance: Math.abs(parseFloat(budget.actual_income || 0) - parseFloat(budget.budgeted_income)),
          expensesVariance: Math.abs(parseFloat(budget.actual_expenses || 0) - parseFloat(budget.budgeted_expenses)),
        };
      });

      setBudgetData(transformedData);
    } catch (error) {
      console.error('Error fetching budget data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const calculateVariancePercentage = (actual, budgeted) => {
    if (budgeted === 0) return '0%';
    const variancePercentage = Math.min(
      ((Math.abs(actual - budgeted) / budgeted) * 100), 
      100
    ).toFixed(1);
    return `${variancePercentage}%`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Convert numeric inputs to numbers
    if (name === 'budgeted_income' || name === 'budgeted_expenses') {
      setFormData({
        ...formData,
        [name]: value === '' ? '' : parseFloat(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.month && formData.period_type === 'monthly') {
      alert('Please select a month');
      return;
    }
    
    if (formData.budgeted_income === '' || formData.budgeted_expenses === '') {
      alert('Please enter both budgeted income and expenses');
      return;
    }
  
    // Prepare data for API
    const budgetPayload = {
      period_type: formData.period_type,
      year: parseInt(formData.year),
      month: formData.period_type === 'monthly' 
        ? getMonthNumber(formData.month) // Convert month name to number 1-12
        : null,
      budgeted_income: parseFloat(formData.budgeted_income),
      budgeted_expenses: parseFloat(formData.budgeted_expenses),
      notes: formData.notes,
      
    };
  
    try {
      setIsLoading(true);
      
      let response;
      
      if (formData.id) {
        // Update existing budget
        response = await api.put(`/budgets/${formData.id}`, budgetPayload);
      } else {
        // Create new budget
        response = await api.post('/budgets', budgetPayload);
      }
      
      // Refresh budget data
      await fetchBudgetData();
      
      // Reset form and close it
      setFormData({
        id: null,
        period_type: 'monthly',
        year: new Date().getFullYear(),
        month: '',
        budgeted_income: '',
        budgeted_expenses: '',
        notes: '',
        
      });
      setShowBudgetForm(false);
      
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('Failed to save budget. Please try again. Check if all the fields have value');
    } finally {
      setIsLoading(false);
    }
  };
// Helper function to convert month name to number
  const getMonthNumber = (monthName) => {
    const months = {
      'January': 1, 'February': 2, 'March': 3, 'April': 4,
      'May': 5, 'June': 6, 'July': 7, 'August': 8,
      'September': 9, 'October': 10, 'November': 11, 'December': 12
    };
    return months[monthName] || '';
  };
  const handleDeleteBudget = async (budgetId) => {
    if (!window.confirm('Are you sure you want to delete this budget entry?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      await api.delete(`/budgets/${budgetId}`);
      
      // Refresh budget data after deletion
      await fetchBudgetData();
      
      alert('Budget entry deleted successfully');
    } catch (error) {
      console.error('Error deleting budget:', error);
      alert('Failed to delete budget entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div>
      <div className="report-section w-full max-w-6xl mx-auto px-4 md:w-full h-[470px] xl:h-[540px] overflow-auto">
        <div className="report-header mb-4">
          <h2 className="text-xl font-bold cursor-default">Budget vs Actual Analysis</h2>
          <p className="text-gray-500 cursor-default">Comparing planned financials with actual performance</p>
        </div>

        <div className="report-actions flex justify-start gap-5 mb-4">
          <button 
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors cursor-pointer" 
            onClick={() => setShowBudgetDetails(!showBudgetDetails)}
          >
            {showBudgetDetails ? 'Back to Chart' : 'View Details'}
          </button>
          
          <button 
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center cursor-pointer"
            onClick={() => {
              setFormData({
                id: null,
                period_type: 'monthly',
                year: new Date().getFullYear(),
                month: '',
                budgeted_income: '',
                budgeted_expenses: '',
                notes: '',
              });
              setShowBudgetForm(true);
            }}
          >
            <Plus size={18} className="mr-1" />
            Add Budget
          </button>
        </div>


        {/* Budget Input Form Modal */}
        {showBudgetForm && (
          <div className="fixed inset-0 backdrop-blur-xs flex items-center justify-center z-50">
            <div className="bg-white rounded-lg border-amber-950 p-8 w-full max-w-lg shadow-xl transform transition-all duration-300 scale-95 hover:scale-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-800">
                  {formData.id ? 'Edit Budget Entry' : 'Add Budget Entry'}
                </h3>
                
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label className="block mb-2 text-sm font-medium text-gray-600">Budget Type</label>
                  <div className="flex gap-6">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="period_type"
                        value="monthly"
                        checked={formData.period_type === 'monthly'}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Monthly</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="period_type"
                        value="yearly"
                        checked={formData.period_type === 'yearly'}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Yearly</span>
                    </label>
                  </div>
                </div>
                
                {formData.period_type === 'monthly' && (
                  <div className="mb-6">
                    <label className="block mb-2 text-sm font-medium text-gray-600">Month</label>
                    <select
                      name="month"
                      value={formData.month}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      required
                    >
                      <option value="">Select Month</option>
                      <option value="January">January</option>
                      <option value="February">February</option>
                      <option value="March">March</option>
                      <option value="April">April</option>
                      <option value="May">May</option>
                      <option value="June">June</option>
                      <option value="July">July</option>
                      <option value="August">August</option>
                      <option value="September">September</option>
                      <option value="October">October</option>
                      <option value="November">November</option>
                      <option value="December">December</option>
                    </select>
                  </div>
                )}
                
                <div className="mb-6">
                  <label className="block mb-2 text-sm font-medium text-gray-600">Year</label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    min="2000"
                    max="2100"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block mb-2 text-sm font-medium text-gray-600">Expected Income (₱)</label>
                  <input
                    type="number"
                    name="budgeted_income"
                    value={formData.budgeted_income}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block mb-2 text-sm font-medium text-gray-600">Budgeted Expenses (₱)</label>
                  <input
                    type="number"
                    name="budgeted_expenses"
                    value={formData.budgeted_expenses}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block mb-2 text-sm font-medium text-gray-600">Notes (Optional)</label>
                  <textarea
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    rows="3"
                  ></textarea>
                </div>
                
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowBudgetForm(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-purple-600 text-white text-sm rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-all duration-300"
                    disabled={isLoading}
                  >
                    <Save size={18} />
                    {isLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="report-body">
          {!showBudgetDetails ? (
            <div className="chart-grid grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="chart-container half-width bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-medium mb-2 cursor-default">Income: Expected vs Actual</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={budgetData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fill: '#333', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#333', fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value) => ['₱' + value.toLocaleString(), '']}
                      contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd' }} 
                    />
                    <Legend />
                    <Bar dataKey="budgetedIncome" fill="#a855f7" name="Expected Income" />
                    <Bar dataKey="totalIncome" fill="#22c55e" name="Actual Income" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container half-width bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-medium mb-2 cursor-default">Expenses: Budget vs Actual</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={budgetData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fill: '#333', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#333', fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value) => ['₱' + value.toLocaleString(), '']}
                      contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd' }} 
                    />
                    <Legend />
                    <Bar dataKey="budgetedExpenses" fill="#a855f7" name="Budgeted Expenses" />
                    <Bar dataKey="totalExpenses" fill="#ef4444" name="Actual Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="data-grid overflow-x-auto bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-medium mb-4 cursor-default">Budget vs Actual Details</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse cursor-default">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2 text-center">Period</th>
                      <th className="border border-gray-300 p-2 text-center">Expected Income</th>
                      <th className="border border-gray-300 p-2 text-center"> Actual Income</th>
                      <th className="border border-gray-300 p-2 text-center">Variance</th>
                      <th className="border border-gray-300 p-2 text-center">Budgeted Expenses</th>
                      <th className="border border-gray-300 p-2 text-right">Actual Expenses</th>
                      <th className="border border-gray-300 p-2 text-center">Variance</th>
                      <th className="border border-gray-300 p-2 text-center">Notes</th>
                      <th className="border border-gray-300 p-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgetData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2">{item.month}</td>
                        <td className="border border-gray-300 p-2 text-center">
                          ₱{item.budgetedIncome.toLocaleString()}
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          ₱{item.totalIncome.toLocaleString()}
                        </td>
                         <td className={`border border-gray-300 p-2 text-center ${
                            item.incomeVariance >= 0 
                              ? item.totalIncome > item.budgetedIncome 
                                ? 'text-green-600' 
                                : 'text-red-600'
                              : 'text-gray-600'
                          }`}>
                            ₱{Math.abs(item.totalIncome - item.budgetedIncome).toLocaleString()} 
                            {` (${calculateVariancePercentage(item.totalIncome, item.budgetedIncome)})`}
                          </td>
                        <td className="border border-gray-300 p-2 text-center">
                          ₱{item.budgetedExpenses.toLocaleString()}
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          ₱{item.totalExpenses.toLocaleString()}
                        </td>
                        <td className={`border border-gray-300 p-2 text-center ${
                            item.expensesVariance >= 0 
                              ? item.totalExpenses < item.budgetedExpenses 
                                ? 'text-green-600' 
                                : 'text-red-600'
                              : 'text-gray-600'
                          }`}>
                            ₱{Math.abs(item.totalExpenses - item.budgetedExpenses).toLocaleString()} 
                            {` (${calculateVariancePercentage(item.totalExpenses, item.budgetedExpenses)})`}
                          </td>
                        <td className="border border-gray-300 p-2 text-center">
                          {item.notes ? (
                            <button 
                              onClick={() => openNotesModal(item.notes)}
                              className="p-1 text-gray-600 hover:text-gray-800"
                              title="View Notes"
                            >
                              <FileText size={19} />
                            </button>
                          ) : '—'}
                        </td>
                        <td className="border border-gray-300 p-2 text-center gap-2.5">
                          <button 
                            onClick={() => {
                              // Pre-fill the form for editing
                              setFormData({
                                id: item.id,
                                period_type: item.periodType,
                                year: item.rawYear || parseInt(item.month.split(' ')[1]),
                                month: item.periodType === 'monthly' 
                                  ? item.month.split(' ')[0] 
                                  : '',
                                budgeted_income: item.budgetedIncome,
                                budgeted_expenses: item.budgetedExpenses,
                                notes: item.notes || '',
                               
                              });
                              setShowBudgetForm(true);
                            }}
                            className="p-1 text-blue-600 hover:text-blue-800 "
                          >
                            <Edit size={19} />
                          </button>
                          <button 
                          onClick={() => handleDeleteBudget(item.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 size={20} />
                        </button>
                        </td>
                        
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {isNotesModalOpen && (
                  <div className="fixed inset-0 backdrop-blur-xs flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl h-[400px] relative p-8">
                      <button
                        onClick={closeNotesModal}
                        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors group"
                      >
                        <X size={24} className="group-hover:scale-110 transition-transform" />
                      </button>
                      
                      <h3 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-3">
                        Notes
                      </h3>
                      
                      <div className="overflow-y-auto max-h-[200px] pr-4 flex items-center justify-center">
                        <p className="text-gray-700 leading-relaxed text-base text-center w-full">
                          {selectedNotes}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default Budget;