import React, { useState, useEffect } from "react";
import { Save, RefreshCw, UploadCloud, X } from 'lucide-react';
import "../styles/payables.css";
import cityLabs from "../cities/cityLabs.js";
import api from '../axiosConfig';

// Lab Component (extracted from original Payables)
function Lab({ onPayableAdded }) {
  const [formData, setFormData] = useState({
    what_to_pay: "",
    date: "",
    amount: "",
    status: "",
    description: "",
    receipts: null,
  });

  const [loading, setLoading] = useState(false);

  const apiUrl = "payables"; // Update with your actual Laravel API URL

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prevData) => ({ ...prevData, receipts: e.target.files[0] }));
  };

  const handleRemoveFile = () => {
    setFormData((prevData) => ({ ...prevData, receipts: null }));
  };

  const handleClear = () => {
    setFormData({ what_to_pay: "", date: "", amount: "", status: "", description: "", receipts: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    const formDataToSend = new FormData();
    formDataToSend.append("what_to_pay", formData.what_to_pay);
    formDataToSend.append("date", formData.date);
    formDataToSend.append("amount", formData.amount);
    formDataToSend.append("status", formData.status);
    formDataToSend.append("description", formData.description);
    if (formData.receipts) {
      formDataToSend.append("receipts", formData.receipts);
    }
  
    try {
      const response = await api.post(apiUrl, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onPayableAdded(response.data.payable, "Lab"); // Pass "Lab" as payableType
      handleClear();
    } catch (error) {
      console.error("Error saving payable:", error);
      onPayableAdded(null, "Lab", error.message || "Error saving payable"); // Pass error message
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
    {/* Top Section */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
      {/* What to pay */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">What to pay</label>
        <input 
          type="text" 
          name="what_to_pay" 
          value={formData.what_to_pay}
          onChange={handleInputChange}
          placeholder="Enter payee or purpose"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          required
        />
      </div>
      
      {/* Date */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Date</label>
        <input 
          type="date" 
          name="date" 
          value={formData.date}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          required
        />
      </div>
      
      {/* Amount */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Amount</label>
        <div className="relative">
          <input 
            type="number" 
            name="amount" 
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="0.00"
            className="w-full pl-8 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            required
          />
        </div>
      </div>
      
      {/* Status */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Status</label>
        <select 
          name="status" 
          value={formData.status}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
          required
        >
          <option value="">Select status</option>
          <option value="Pending">Pending</option>
          <option value="Paid" disabled={!formData.receipts}>Paid</option>
          <option value="Others">Others</option>
        </select>
        {formData.status === "" && (
          <p className="text-xs text-gray-500 mt-1">Select payment status</p>
        )}
        {formData.status === "Paid" && !formData.receipts && (
          <p className="text-xs text-amber-600 mt-1">Upload receipt to mark as paid</p>
        )}
      </div>
    </div>
    
    {/* Description */}
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Description</label>
      <textarea 
        name="description" 
        value={formData.description}
        onChange={handleInputChange}
        placeholder="Enter payment details or notes"
        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:text-[#444444]  focus:border-transparent transition duration-200 h-24 resize-none"
        required
      ></textarea>
    </div>
    
    {/* Receipt Upload */}
    <div className="space-y-2 mt-2">
      <label className="block text-sm font-medium text-gray-700">Receipt</label>
      <div className="flex items-center gap-3">
        <div className="flex-1 border border-gray-300 rounded-md overflow-hidden">
          <div className="relative flex items-center">
            <input 
              type="file" 
              id="fileInputPayables" 
              onChange={handleFileChange}
              accept=".pdf,.jpeg,.jpg,.png" 
              className="hidden" 
            />
            <label 
              htmlFor="fileInputPayables" 
              className="flex items-center gap-2 w-full h-6 px-4 py-2 bg-gray-50 hover:bg-gray-100 cursor-pointer transition duration-200"
            >
              <UploadCloud size={20} className="text-teal-600" />
              <span className="text-gray-700 truncate">
                {formData.receipts ? formData.receipts.name : "Upload receipt"}
              </span>
            </label>
            {formData.receipts && (
              <button 
                type="button"
                onClick={handleRemoveFile}
                className="absolute right-2 p-1 rounded-full hover:bg-gray-200 transition duration-200"
              >
                <X size={16} className="text-gray-500" />
              </button>
            )}
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500">
        {formData.receipts ? `File selected: ${formData.receipts.name}` : "Accepted formats: JPEG, PNG"}
      </p>
    </div>
    
    {/* Action Buttons */}
    <div className="flex justify-end items-center space-x-4 pt-4 border-t border-gray-100 gap-5">
      <button 
        type="button" 
        onClick={handleClear}
        className="flex items-center gap-2 px-5 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200 font-medium cursor-pointer"
      >
        <RefreshCw size={16} />
        <span>Clear Form</span>
      </button>
      <button 
        type="submit" 
        disabled={loading}
        className="flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium shadow-md transition duration-200 cursor-pointer"
        
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Saving...</span>
          </>
        ) : (
          <>
            <Save size={16} />
            <span >Save</span>
          </>
        )}
      </button>
    </div>
  </form>
  );
}

// New OtherPayables Component
function OtherPayables({ onPayableAdded }) {
  const [formData, setFormData] = useState({
    city: "",
    lab: "",
    address: "",
    date: "",
    amount_paid: "",
    mode_of_payment: "",
    account_number: "",
    received_by: "",
  });

  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(false);

  const apiUrl = "other-payables"; // Update with actual API URL

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));

    // If city is changed, update available labs
    if (name === "city") {
      setLabs(cityLabs[value] || []);
      setFormData((prevData) => ({ ...prevData, lab: "" })); // Reset lab selection
    }
  };

  const handleClear = () => {
    setFormData({
      city: "",
      lab: "",
      address: "",
      date: "",
      amount_paid: "",
      mode_of_payment: "",
      account_number: "",
      received_by: "",
    });
    setLabs([]); // Reset labs list
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      const response = await api.post(apiUrl, formData, {
        headers: { "Content-Type": "application/json" },
      });
      onPayableAdded(response.data.payable, "OtherPayables"); // Pass "OtherPayables" as payableType
      handleClear();
    } catch (error) {
      console.error("Error saving other payable:", error);
      onPayableAdded(null, "OtherPayables", error.message || "Error saving other payable"); // Handle errors accordingly
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
    {/* Location Section */}
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
      <h3 className="text-lg font-medium text-gray-700 mb-4">Location Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* City Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">City</label>
          <select 
            name="city" 
            value={formData.city} 
            onChange={handleInputChange}
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
            required
          >
            <option value="">Select City</option>
            {Object.keys(cityLabs).map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
        
        {/* Laboratory Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Laboratory</label>
          <select 
            name="lab" 
            value={formData.lab} 
            onChange={handleInputChange}
            className={`w-full px-4 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200 ${!formData.city ? 'opacity-60 cursor-not-allowed' : ''}`}
            required
            disabled={!formData.city}
          >
            <option value="">Select Laboratory</option>
            {labs.map((lab) => (
              <option key={lab} value={lab}>
                {lab}
              </option>
            ))}
          </select>
        </div>
        
        {/* Address */}
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Laboratory Address</label>
          <input 
            type="text" 
            name="address" 
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Full laboratory address"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
            required
          />
        </div>
      </div>
    </div>
    
    {/* Payment Information Section */}
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
      <h3 className="text-lg font-medium text-gray-700 mb-4">Payment Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Payment Date</label>
          <input 
            type="date" 
            name="date" 
            value={formData.date}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
            required
          />
        </div>
        
        {/* Amount Paid */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Amount Paid</label>
          <div className="relative">
            <input 
              type="number" 
              name="amount_paid" 
              value={formData.amount_paid}
              onChange={handleInputChange}
              placeholder="0.00"
              className="w-full pl-8 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
              required
            />
          </div>
        </div>
        
        {/* Mode of Payment */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Payment Method</label>
          <select
            name="mode_of_payment"
            value={formData.mode_of_payment}
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
        
        {/* Account Number */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Account Number</label>
          <input 
            type="text" 
            name="account_number" 
            value={formData.account_number}
            onChange={handleInputChange}
            placeholder="Payment account reference"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
            required
          />
        </div>
        
        {/* Received By */}
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Received By</label>
          <input 
            type="text" 
            name="received_by" 
            value={formData.received_by}
            onChange={handleInputChange}
            placeholder="Name of the person who received the payment"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent transition duration-200"
            required
          />
        </div>
      </div>
    </div>
    
    {/* Action Buttons */}
    <div className="flex justify-end space-x-4 pt-4 gap-5">
      <button 
        type="button" 
        onClick={handleClear}
        className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200 font-medium cursor-pointer"
      >
        <RefreshCw size={16} />
        Clear Form
      </button>
      <button 
        type="submit" 
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200 font-medium cursor-pointer"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <Save size={16} />
            <span>Save Payment</span>
          </>
        )}
      </button>
    </div>
  </form>
  );
}

// Main Payables Component with prop for initial type and message callback
function Payables({ initialPayableType = "Lab", onMessageUpdate = null }) {
  const [payableType, setPayableType] = useState(initialPayableType);
  const [payables, setPayables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Use the initialPayableType prop when mounting
  useEffect(() => {
    setPayableType(initialPayableType);
  }, [initialPayableType]);

  // Update messages in parent component if callback provided
  useEffect(() => {
    if (onMessageUpdate && successMessage) {
      onMessageUpdate(successMessage);
    }
  }, [successMessage, onMessageUpdate]);

  useEffect(() => {
    if (onMessageUpdate && errorMessage) {
      onMessageUpdate(errorMessage, true);
    }
  }, [errorMessage, onMessageUpdate]);

  const handlePayableTypeChange = (type) => {
    setPayableType(type);
  };

  const handlePayableAdded = (newPayable, type, error = null) => {
    if (error) {
      setErrorMessage(error);
      if (onMessageUpdate) onMessageUpdate(error, true);
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    
    if (newPayable) {
      setPayables([...payables, newPayable]); // Update payables list
      
      // Set success message based on the payable type
      const message = type === "Lab" 
        ? "New Others list added successfully!" 
        : "New Receivable added successfully!";
      
      setSuccessMessage(message);
      if (onMessageUpdate) onMessageUpdate(message);
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  return (
    <div>
      {(!onMessageUpdate) && (
        <>
          <h1 className="header-title text-left text-2xl font-bold mb-4">Receivables</h1>
          
          {/* Button Navigation */}
          <div className="flex space-x-2 border-b border-gray-200 pb-2 mb-6">
            <button
              onClick={() => handlePayableTypeChange("Lab")}
              className={`px-4 py-2 rounded-t-lg font-medium transition-all ${
                payableType === "Lab" 
                  ? "bg-amber-900 text-white shadow-md" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Other Payables
            </button>
            <button
              onClick={() => handlePayableTypeChange("OtherPayables")}
              className={`px-4 py-2 rounded-t-lg font-medium transition-all ${
                payableType === "OtherPayables" 
                  ? "bg-amber-900 text-white shadow-md" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Receivables
            </button>
          </div>
          
          {successMessage && (
            <div className="fixed top-28 right-10 bg-green-100 text-green-500 p-4 rounded-lg shadow-md z-50">
              {successMessage}
            </div>
          )}
          
          {errorMessage && (
            <div className="fixed top-28 right-10 bg-red-100 text-red-500 p-4 rounded-lg shadow-md z-50">
              {errorMessage}
            </div>
          )}
        </>
      )}

      {/* Render the appropriate component based on selection */}
      {payableType === "Lab" && (
        <Lab onPayableAdded={handlePayableAdded} />
      )}
      
      {payableType === "OtherPayables" && (
        <OtherPayables onPayableAdded={handlePayableAdded} />
      )}
    </div>
  );
}

export default Payables;