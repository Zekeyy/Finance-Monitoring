import React, { useEffect, useState } from 'react';
import '../styles/addTransaction.css';
import Payables from '../views/Payables';
import { X, UploadCloud, Save, RefreshCw } from "lucide-react";
import api from '../axiosConfig';

function AddTransaction() {
  const [activeView, setActiveView] = useState("TransactionInput");
  const [formData, setFormData] = useState({
    name: '',
    tags: '',
    company: '',
    amount: '',
    cost_or_income: '',
    expenses_category:'',
    date: new Date().toISOString().split('T')[0],
    type_of_payment: '',
    description: '',
    receipt: null
  });
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle navigation view change
  const handleViewChange = (view) => {
    setActiveView(view);
    setError('');
    setSuccess('');
  };

  // Fixed input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Fixed file change handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ["application/pdf", "image/jpeg", "image/png"];
      
      if (!validTypes.includes(file.type)) {
        setError("Please upload only PDF, JPEG, or PNG files");
        e.target.value = ""; // Clear file input
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError("File size should not exceed 5MB");
        e.target.value = "";
        return;
      }
      
      // Fixed: Update receipt while preserving other form data
      setFormData(prevState => ({
        ...prevState,
        receipt: file
      }));
      setError("");
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
        try {
            // This will automatically handle token refresh if needed
            const response = await api.get("/user");
            
            if (response.data.user) {
                setUserData(response.data.user);
                localStorage.setItem("user", JSON.stringify(response.data.user));
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    fetchUserData();
  }, []);

  const handleClear = () => {
    setFormData({
      name: '',
      tags: '',
      company: '',
      date: new Date().toISOString().split('T')[0], // Reset to current date instead of empty
      amount: '',
      cost_or_income: '',
      expenses_category:'',
      type_of_payment: '',
      description: '',
      receipt: null
    });
    setError('');
    setSuccess('');
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation before submission
    if (!formData.name || !formData.tags || !formData.company || 
        !formData.amount || !formData.cost_or_income || !formData.date || 
        !formData.type_of_payment || !formData.description) {
      setError("Please fill in all required fields");
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setLoading(true);
    
    // Create FormData object for file upload
    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null) {
        submitData.append(key, formData[key]);
      }
    });
  
    try {
      console.log("Submitting data:", Object.fromEntries(submitData));
      
      const response = await api.post('transactions', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
  
      if (response.status === 201 || response.status === 200) { 
        setSuccess('Transaction added successfully!');
        setTimeout(() => setSuccess(''), 3000);
        handleClear(); // Clear form after successful submission
      } else {
        setError('Unexpected response from server.');
      }
    } catch (err) {
      console.error("Error details:", err);
      setError(err.response?.data?.message || 'Error submitting transaction');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
    setSuccess('Transaction added successfully!');
  };
  
  // Message handler for Payables component
  const handlePayablesMessage = (message, isError = false) => {
    if (isError) {
      setError(message);
      setTimeout(() => setError(''), 3000);
    } else {
      setSuccess(message);
      setTimeout(() => setSuccess(''), 3000);
    }
  };
  
  // Map views to Payables component payableType prop values
  const getPayableTypeFromView = (view) => {
    switch(view) {
      case "Payables":
        return "Lab";
      case "OtherPayables":
        return "OtherPayables";
      default:
        return "Lab";
    }
  };
  
  return (
    <div className="form-container bg-white shadow-lg rounded-lg p-6">
      <div className="mb-8">
        
      <div className="flex space-x-2 border-b border-gray-200 pb-5 gap-6">
  <button
    onClick={() => handleViewChange("TransactionInput")}
    className={`relative py-2 px-8 text-base font-bold overflow-hidden rounded-full transition-all duration-400 ease-in-out shadow-md hover:scale-105 hover:shadow-lg active:scale-90 cursor-pointer ${
      activeView === "TransactionInput"
        ? "bg-blue-500 text-white shadow-md border-2 border-blue-600" // Enhanced active state
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
  >
    Transaction Input
    {activeView === "TransactionInput" && (
      <span className="absolute bottom-0 left-0 w-full h-1 bg-[#333333]"></span>
    )}
  </button>

  <button
    onClick={() => handleViewChange("OtherPayables")}
    className={`relative py-2 px-8 text-base font-bold overflow-hidden rounded-full transition-all duration-400 ease-in-out shadow-md hover:scale-105 hover:shadow-lg active:scale-90 cursor-pointer ${
      activeView === "OtherPayables"
        ? "bg-blue-500 text-white shadow-md border-2 border-blue-600" // Enhanced active state
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
  >
    Receivables
    {activeView === "OtherPayables" && (
      <span className="absolute bottom-0 left-0 w-full h-1 bg-[#333333]"></span>
    )}
  </button>

  <button
    onClick={() => handleViewChange("Payables")}
    className={`relative py-2 px-10 text-base font-bold overflow-hidden rounded-full transition-all duration-400 ease-in-out shadow-md hover:scale-105 hover:shadow-lg active:scale-90 cursor-pointer ${
      activeView === "Payables"
        ? "bg-blue-500 text-white shadow-md border-2 border-blue-600" // Enhanced active state
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
  >
    Others
    {activeView === "Payables" && (
      <span className="absolute bottom-0 left-0 w-full h-1 bg-[#333333]" ></span>
    )}
  </button>
</div>

      </div>

      <div className="fixed top-28 right-10 space-y-2 z-50">
        {error && <div className="bg-red-100 text-red-500 p-4 rounded-lg shadow-md">{error}</div>}
        {success && <div className="bg-green-100 text-green-500 p-4 rounded-lg shadow-md">{success}</div>}
      </div>

      {activeView === "TransactionInput" ? (
       <form onSubmit={handleSubmit} className="space-y-6">
       {/* Top row fields */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="space-y-2">
           <label className="block text-sm font-medium text-gray-700">Name</label>
           <input
             type="text"
             name="name"
             value={formData.name}
             onChange={handleInputChange}
             placeholder="Client name"
             className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
             required
           />
         </div>
         
         <div className="space-y-2">
           <label className="block text-sm font-medium text-gray-700">Position</label>
           <input
             type="text"
             name="tags"
             value={formData.tags}
             onChange={handleInputChange}
             placeholder="Contact position"
             className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
             required
           />
         </div>
       </div>
       
       {/* Second row fields */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="space-y-2">
           <label className="block text-sm font-medium text-gray-700">Company</label>
           <input
             type="text"
             name="company"
             value={formData.company}
             onChange={handleInputChange}
             placeholder="Company name"
             className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
             required
           />
         </div>
         
         <div className="space-y-2">
           <label className="block text-sm font-medium text-gray-700">Transaction Date</label>
           <input
             type="date"
             name="date"
             value={formData.date}
             onChange={handleInputChange}
             className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
             required
           />
         </div>
       </div>
       
       {/* Third row fields */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="space-y-2">
           <label className="block text-sm font-medium text-gray-700">Amount</label>
           <div className="relative">
             <input
               type="number"
               name="amount"
               value={formData.amount}
               onChange={handleInputChange}
               placeholder="0.00"
               className="w-full pl-8 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
               required
             />
           </div>
         </div>
         
         <div className="space-y-2">
           <label className="block text-sm font-medium text-gray-700">Payment Method</label>
           <select
             name="type_of_payment"
             value={formData.type_of_payment}
             onChange={handleInputChange}
             className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
             required
           >
            <option value="" disabled>Select Payment Method</option>
            <option value="Cash">Cash</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="PayPal">PayPal</option>
            <option value="GCash">GCash</option>
            <option value="Maya">Maya</option>
           </select>
         </div>
       </div>
       
       {/* Fourth row fields */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="space-y-2">
           <label className="block text-sm font-medium text-gray-700">Category</label>
           <select
             name="cost_or_income"
             value={formData.cost_or_income}
             onChange={handleInputChange}
             className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
             required
           >
             <option value="">Select transaction type</option>
             <option value="Income">Income</option>
             <option value="Expenses">Expenses</option>
           </select>
         </div>
         
         {formData.cost_or_income === "Expenses" && (
           <div className="space-y-2">
             <label className="block text-sm font-medium text-gray-700">Expense Category</label>
             <input
               type="text"
               name="expenses_category"
               value={formData.expenses_category}
               onChange={handleInputChange}
               placeholder="e.g. Office Supplies, Travel"
               className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
               required
             />
           </div>
         )}
       </div>
       
       {/* Description field */}
       <div className="space-y-2">
         <label className="block text-sm font-medium text-gray-700">Description</label>
         <textarea
           name="description"
           value={formData.description}
           onChange={handleInputChange}
           placeholder="Additional details about this transaction"
           className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:text-[#444444]  focus:border-transparent transition duration-200 h-24"
           required
         ></textarea>
       </div>
       
       {/* File Upload */}
       <div className="space-y-2">
         <label className="block text-sm font-medium text-gray-700">Receipt</label>
         <div className="flex items-center gap-4 border border-gray-300 p-3 rounded-md bg-gray-300 hover:bg-gray-200 transition duration-200">
           <label className="flex items-center gap-2 cursor-pointer">
             <UploadCloud size={20} className="text-teal-600" />
             <input
               type="file"
               onChange={handleFileChange}
               accept=".pdf,.jpeg,.jpg,.png"
               className="hidden"
             />
             <span className="text-gray-700">
               {formData.receipt ? formData.receipt.name : "Upload receipt document"}
               <p className="text-xs text-gray-500">
        {formData.receipt ? `File selected: ${formData.receipt.name}` : "Accepted formats: JPEG, PNG"}
      </p>
             </span>
             
           </label>
           
           {formData.receipt && (
             <X
               size={18}
               className="cursor-pointer text-gray-500 hover:text-red-500 ml-auto"
               onClick={() => setFormData({ ...formData, receipt: null })}
             />
           )}
         </div>
       </div>
       
       {/* Form buttons */}
       <div className="flex justify-end space-x-4 pt-7 gap-5 mt-5">
         <button 
           type="button" 
           onClick={handleClear}
           className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-200 cursor-pointer"
         >
           <RefreshCw size={16} />
           Clear Form
         </button>
         <button 
           type="submit" 
           disabled={loading}
           className="flex items-center gap-2 px-6 py-2 bg-teal-600 rounded-md text-white hover:bg-teal-700 transition duration-200 cursor-pointer"
         >
           {loading ? (
             <>
               <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
               <span>Saving...</span>
             </>
           ) : (
             <>
               <Save size={16} />
               <span>Save Transaction</span>
             </>
           )}
         </button>
       </div>
     </form>
      ) : (
        <Payables 
          initialPayableType={getPayableTypeFromView(activeView)}
          onMessageUpdate={handlePayablesMessage}
        />
      )}
    </div>
  );
}

export default AddTransaction;