import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Modal from 'react-modal';
import '../styles/transactionHistory.css';
import { format } from 'date-fns';
import TransactionHistory from './TransactionHistory';
import'../styles/payables.css' 
import OtherPayables from './OthersPayables';
import { UploadCloud, Eye, CheckCircle, Loader, RefreshCw, Download } from "lucide-react";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoData from '../assets/images/gamma.png';
function PayableView() {
  const [payables, setPayables] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [statusModalIsOpen, setStatusModalIsOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedPayable, setSelectedPayable] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [receiptFile, setReceiptFile] = useState(null); 
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('Payables');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  // State for image zoom functionality
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [allPayables, setAllPayables] = useState([]); // For storing all filtered data for download
  const [downloading, setDownloading] = useState(false); // To track download status

  const [userData, setUserData] = useState(null);
  const [appliedFilter, setAppliedFilter] = useState({ startDate: '', endDate: '' });
  // Handle user data and authentication
  useEffect(() => {
    const handleStorageChange = (e) => {
        // Check if the logout event was triggered
        if (e.key === 'isLoggedIn' && e.newValue === null) {
            // Clear local data and redirect
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            delete axios.defaults.headers.common['Authorization'];
            window.location.href = '/';
        }
    };

    // Add event listener
    window.addEventListener('storage', handleStorageChange);

    // Check authentication on mount
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        window.location.href = '/';
    }

    // Setup axios default header
    const token = localStorage.getItem('token');
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    // Load user data
    fetchUserData();

    // Cleanup listener on unmount
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  // Fetch user data from API or local storage
  const fetchUserData = async () => {
    // First try to get from localStorage
    const storedUser = localStorage.getItem('user');
    
    if (storedUser) {
        setUserData(JSON.parse(storedUser));
    }
    
    // Then try to fetch fresh data from API
    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('authToken');
        
        if (!token) {
            return;
        }
        
        const response = await axios.get('http://192.168.254.192:8000/api/user', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.data.user) {
            setUserData(response.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        
    }
  };

  const statusOptions = ['Pending', 'Paid', 'Cancelled', 'Others'];

  const fetchPayables = async (page, filters) => {
    try {
      setLoading(true);
  
       let url = `http://192.168.254.192:8000/api/payables/filter?page=${page}`;
      
      if (filters.startDate && filters.endDate) {
        url += `&start_date=${filters.startDate}&end_date=${filters.endDate}`;
      }
  
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
  
      if (response.data.data) {
        setPayables(response.data.data);
        setTotalPages(Math.ceil(response.data.total / response.data.per_page));
      } else {
        setPayables(response.data);
        setTotalPages(1);
      }
  
      setLoading(false);
    } catch (err) {
      console.error('Error fetching payables:', err);
      setError('Error fetching payables');
      setLoading(false);
      setTimeout(() => setError(''), 3000);
    }
  };
  
  useEffect(() => {
    if (viewMode === 'Payables') {
      fetchPayables(currentPage, appliedFilter);
    }
  }, [currentPage, appliedFilter, viewMode]);
 
  const handleDateFilterChange = (e) => {
    const { name, value } = e.target;
    setDateFilter(prev => ({ ...prev, [name]: value }));
  };
 
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setAppliedFilter({ ...dateFilter });
    setCurrentPage(1);
  };
 
  const handleFilterReset = () => {
    setDateFilter({ startDate: '', endDate: '' });
    setAppliedFilter({ startDate: '', endDate: '' });
    setCurrentPage(1);
  };

  const handleViewModeChange = (e) => {
    setViewMode(e.target.value);
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const openModal = (receiptUrl) => {
    setSelectedReceipt(`http://192.168.254.192:8000/storage/${receiptUrl}`);
    setModalIsOpen(true);
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };
  
  const closeModal = () => {
    setSelectedReceipt(null);
    setModalIsOpen(false);
  };

  const openStatusModal = (payable) => {
    setSelectedPayable(payable);
    setNewStatus(payable.status);
    setStatusModalIsOpen(true);
    setReceiptFile(null);
  };

  const closeStatusModal = () => {
    setSelectedPayable(null);
    setNewStatus('');
    setReceiptFile(null);
    setStatusModalIsOpen(false);
  };
  
  // Mouse event handlers for dragging
  const handleMouseDown = (e) => {
    if (zoomLevel > 1) { // Only enable dragging when zoomed in
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      setPosition(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle wheel events for zooming with scroll
  const handleWheel = (e) => {
    // Check if we're in the modal
    if (!modalIsOpen) return;
    
    // Update zoom based on wheel direction
    if (e.deltaY < 0) {
      setZoomLevel(prev => Math.min(prev + 0.1, 3));
    } else {
      setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
    }
  };
  
  const updatePayableStatus = async () => {
    if (!selectedPayable || updating) return;
  
    try {
      setUpdating(true);
  
      // Create FormData to send status and file
      const formData = new FormData();
      formData.append('status', newStatus);
      if (receiptFile) {
        formData.append('receipts', receiptFile); // Attach the file
      }
  
      const response = await axios.post(
        `http://192.168.254.192:8000/api/payables/${selectedPayable.id}/update-status`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'multipart/form-data', // Required for file uploads
          },
        }
      );
  
      if (response.status === 200) {
        // Update the payable in the local state
        const updatedPayables = payables.map((p) =>
          p.id === selectedPayable.id ? { ...p, status: newStatus, receipts: response.data.receipts } : p
        );
        setPayables(updatedPayables);
        closeStatusModal();
  
        // Show success message
        setError('Status updated successfully!');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Error updating payable status:', err);
      setError('Failed to update status');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUpdating(false);
    }
  };

  // Function to fetch all payables for download
  const fetchAllPayablesForDownload = async () => {
    try {
      setDownloading(true);
      
      // Create URL with filters but without pagination
      // let url = 'http://192.168.254.192:8000/api/payables/all';
      let url = 'http://127.0.0.1:8000/api/payables/all';
      if (appliedFilter.startDate && appliedFilter.endDate) {
        url += `?start_date=${appliedFilter.startDate}&end_date=${appliedFilter.endDate}`;
      }
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      return response.data;
    } catch (err) {
      console.error('Error fetching all payables for download:', err);
      setError('Failed to download data');
      setTimeout(() => setError(''), 3000);
      return [];
    }
  };

  // Function to generate and download PDF with professional styling
// Function to generate and download PDF with professional styling
const handleDownloadPDF = async () => {
  try {
    setDownloading(true);
    setError('Preparing download...');
    
    // Fetch all filtered payables data
    const allPayablesData = await fetchAllPayablesForDownload();
    
    // Check if we have data to export
    if (!allPayablesData || allPayablesData.length === 0) {
      setError('No data available to download');
      setTimeout(() => setError(''), 3000);
      setDownloading(false);
      return;
    }
    
    // Create PDF document
    const doc = new jsPDF();
    
    // Add GammaCare logo
    try {
      doc.addImage(logoData, 'PNG', 14, 10, 60, 30);
    } catch (logoErr) {
      console.error('Error adding logo:', logoErr);
      // Continue without logo if there's an error
    }
    
    // Add title
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Other Reports", 14, 50);
    
    // Add generated date
    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), 'MMM dd, yyyy')}`, 14, 60);
    
    // Format data for table
    const tableData = allPayablesData.map(item => [
      formatDate(item.date),
      item.what_to_pay,
      formatAmount(item.amount),
      item.status,
      item.description || 'N/A'
    ]);
    
    // Add table with GammaCare styling
    autoTable(doc, {
      startY: 70,
      head: [['Date', 'What to Pay', 'Amount', 'Status', 'Description']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [38, 97, 56], // GammaCare green color
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 9,
        cellPadding: 4
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 40 },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30 },
        4: { cellWidth: 'auto' }
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      }
    });
    
    // Calculate totals
    const sumTotal = allPayablesData.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const paidCount = allPayablesData.filter(item => item.status === 'Paid').length;
    const pendingCount = allPayablesData.filter(item => item.status === 'Pending').length;
    const cancelledCount = allPayablesData.filter(item => item.status === 'Cancelled').length;
    const othersCount = allPayablesData.filter(item => item.status === 'Others').length;
    
    // Get the final y position after the table
    const finalY = doc.lastAutoTable.finalY || 200;
    
    // Add summary with GammaCare styling
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    // Total amount with bold styling
    doc.setFont(undefined, 'bold');
    doc.text(`Total Amount: ${formatAmount(sumTotal)}`, 14, finalY + 10);
    doc.setFont(undefined, 'normal');
    
   
    // Add footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      doc.text(`Page ${i} of ${pageCount}`, pageSize.width / 2, pageHeight - 10, { align: 'center' });
    }
    
    // Save with professional filename
    let filename = 'GammaCare-Report';
    if (appliedFilter.startDate && appliedFilter.endDate) {
      filename += `_${format(new Date(appliedFilter.startDate), 'yyyy-MM-dd')}_to_${format(new Date(appliedFilter.endDate), 'yyyy-MM-dd')}`;
    } else {
      filename += `_${format(new Date(), 'yyyy-MM-dd')}`;
    }
    filename += `.pdf`;
    
    doc.save(filename);
    
    setError('Download complete!');
    setTimeout(() => setError(''), 3000);
  } catch (err) {
    console.error('Error generating PDF:', err);
    setError('Failed to generate PDF: ' + err.message);
    setTimeout(() => setError(''), 3000);
  } finally {
    setDownloading(false);
  }
};
  // Skeleton loader component for table rows
  const TableRowSkeleton = () => {
    return Array(5).fill(0).map((_, index) => (
      <tr key={`skeleton-${index}`} className="skeleton-row">
        <td><Skeleton height={20} /></td>
        <td><Skeleton height={20} /></td>
        <td><Skeleton height={20} /></td>
        <td><Skeleton height={20} width={80} /></td>
        <td><Skeleton height={20} /></td>
        <td><Skeleton height={20} width={50} /></td>
        <td><Skeleton height={20} width={30} /></td>
      </tr>
    ));
  };
 
  // Early returns for alternative view modes
  if (viewMode === 'Transaction') {
    return <TransactionHistory closeModal={() => setViewMode('Transaction')} />;
  }

  if (viewMode === 'OtherPayables') {
    return <OtherPayables closeModal={() => setViewMode('Transaction')} />;
  }
  
  return (
    <div className="transaction-containers">
      <div className="content-wrapper">
          <div className="filters-section">
            <form onSubmit={handleFilterSubmit} className="date-filters">
              <div className="filter-group">
                <label htmlFor="startDate" className='from'>From:</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={dateFilter.startDate}
                  onChange={handleDateFilterChange}
                  max={dateFilter.endDate || undefined}
                />
              </div>
              <div className="filter-group">
                <label htmlFor="endDate" className='to'>To:</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={dateFilter.endDate}
                  onChange={handleDateFilterChange}
                  min={dateFilter.startDate || undefined}
                />
              </div>
              <div className="filter-actions cursor-pointer">
                <button type="submit" className="filter-btn" title="Apply Filter">
                  <CheckCircle size={22} />
                </button>
                <button 
                  type="button"
                  className="reset-filter-btn cursor-pointer"
                  title='Reset Filter'
                  onClick={handleFilterReset}
                >
                  <RefreshCw size={22} />
                </button>
                <button 
                  type="button"
                  className="download-btn cursor-pointer"
                  title='Download PDF'
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                >
                  <Download size={22} />
                </button>
              </div>
              <div className="view-select-container" style={{ marginBottom: '2px' }}>
                <select 
                  id="viewMode" 
                  value={viewMode} 
                  onChange={handleViewModeChange}
                  className="view-select"
                >
                  <option value="Transaction">Transactions</option>
                  <option value="OtherPayables">Receivables</option>
                  <option value="Payables">Others</option>
                </select>
              </div>
            </form>
          </div>

          <div className="table-wrapper">
            <table className="transaction-table">
              <thead>
                <tr>
                  {['Date', 'What to Pay','Amount', 'Status', 'Description', 'Receipt', 'Actions'].map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <TableRowSkeleton />
                ) : payables.length > 0 ? (
                  payables.map((payable) => (
                    <tr key={payable.id}>
                      <td>{formatDate(payable.date)}</td>
                      <td>{payable.what_to_pay}</td>
                      
                      <td className="expenses-amount">
                        {formatAmount(payable.amount)}
                      </td>
                      
                      <td>
                        <span className={`status-badge ${payable.status.toLowerCase()}`}>
                          {payable.status}
                        </span>
                      </td>
                      <td>{payable.description}</td>
                      <td>
                        {payable.receipts ? (
                          <button onClick={() => openModal(payable.receipts)} className="p-1 text-blue-600 hover:text-blue-800 cursor-pointer">
                            <Eye size={25} />
                          </button>
                        ) : (
                          "No Receipt"
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => openStatusModal(payable)}
                          title='Update status'
                          className="status-btn cursor-pointer"
                        >
                         <Loader size={22} color="blue" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="no-data">
                      No payables found for the selected date range
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {!loading && totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="page-button"
              >
                Previous
              </button>
              
              {(() => {
                // If total pages is 8 or less, show all pages
                if (totalPages <= 8) {
                  return [...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => handlePageChange(index + 1)}
                      className={`page-button ${currentPage === index + 1 ? 'active' : ''}`}
                    >
                      {index + 1}
                    </button>
                  ));
                }

                // Logic for more than 8 pages
                const pageNumbers = [];

                // Always show first pages or last pages based on current page
                if (currentPage <= 4) {
                  // Show first 5 pages
                  for (let i = 1; i <= 5; i++) {
                    pageNumbers.push(
                      <button
                        key={i}
                        onClick={() => handlePageChange(i)}
                        className={`page-button ${currentPage === i ? 'active' : ''}`}
                      >
                        {i}
                      </button>
                    );
                  }

                  // Add ellipsis before last two pages
                  pageNumbers.push(
                    <span key="ellipsis" className="page-ellipsis">
                      ...
                    </span>,
                    <button
                      key={totalPages - 1}
                      onClick={() => handlePageChange(totalPages - 1)}
                      className="page-button"
                    >
                      {totalPages - 1}
                    </button>,
                    <button
                      key={totalPages}
                      onClick={() => handlePageChange(totalPages)}
                      className="page-button"
                    >
                      {totalPages}
                    </button>
                  );
                } 
                // Show last pages
                else if (currentPage >= totalPages - 3) {
                  // First two pages
                  pageNumbers.push(
                    <button
                      key={1}
                      onClick={() => handlePageChange(1)}
                      className="page-button"
                    >
                      1
                    </button>,
                    <button
                      key={2}
                      onClick={() => handlePageChange(2)}
                      className="page-button"
                    >
                      2
                    </button>,
                    <span key="start-ellipsis" className="page-ellipsis">
                      ...
                    </span>
                  );

                  // Last 5 pages
                  for (let i = totalPages - 4; i <= totalPages; i++) {
                    pageNumbers.push(
                      <button
                        key={i}
                        onClick={() => handlePageChange(i)}
                        className={`page-button ${currentPage === i ? 'active' : ''}`}
                      >
                        {i}
                      </button>
                    );
                  }
                }
                // For pages in the middle
                else {
                  // First two pages
                  pageNumbers.push(
                    <button
                      key={1}
                      onClick={() => handlePageChange(1)}
                      className="page-button"
                    >
                      1
                    </button>,
                    <button
                      key={2}
                      onClick={() => handlePageChange(2)}
                      className="page-button"
                    >
                      2
                    </button>,
                    <span key="start-ellipsis" className="page-ellipsis">
                      ...
                    </span>
                  );

                  // Current page and surrounding pages
                  for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pageNumbers.push(
                      <button
                        key={i}
                        onClick={() => handlePageChange(i)}
                        className={`page-button ${currentPage === i ? 'active' : ''}`}
                      >
                        {i}
                      </button>
                    );
                  }

                  // Ellipsis and last two pages
                  pageNumbers.push(
                    <span key="end-ellipsis" className="page-ellipsis">
                      ...
                    </span>,
                    <button
                      key={totalPages - 1}
                      onClick={() => handlePageChange(totalPages - 1)}
                      className="page-button"
                    >
                      {totalPages - 1}
                    </button>,
                    <button
                      key={totalPages}
                      onClick={() => handlePageChange(totalPages)}
                      className="page-button"
                    >
                      {totalPages}
                    </button>
                  );
                }

                return pageNumbers;
              })()}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="page-button"
              >
                Next
              </button>
            </div>
          )}
          
          <Modal
            isOpen={modalIsOpen}
            onRequestClose={closeModal}
            contentLabel="Receipt Viewer"
            className="modal w-3xl h-[500px]"
            overlayClassName="overlay"
            appElement={document.getElementById('root')}
          >
            <button className="close-btn" onClick={closeModal}>&times;</button> 
            <div 
              className="image-container"
              onWheel={handleWheel}
              style={{ 
                overflow: 'hidden',
                height: 'calc(100% - 40px)',
                width: '90vw',
                position: 'relative'
              }}
            >
              {selectedReceipt ? (
                <div
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{ 
                    cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <img 
                    src={selectedReceipt} 
                    alt="Receipt" 
                    className="receipt-image" 
                    style={{
                      transform: `scale(${zoomLevel}) translate(${position.x}px, ${position.y}px)`,
                      transformOrigin: 'center center',
                      transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                      maxWidth: '100%',
                      maxHeight: '100%'
                    }}
                  />
                </div>
              ) : (
                <p>No Receipt Available</p>
              )}
            </div>
          </Modal>

          {/* Status Update Modal */}
          <Modal
            isOpen={statusModalIsOpen}
            onRequestClose={closeStatusModal}
            contentLabel="Update Status"
            className="modal"
            overlayClassName="overlay"
            appElement={document.getElementById('root')}
          >
            {selectedPayable ? (
              <div className="status-modal-content">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Update Status</h2>
                </div>

                {/* Show error message if payable is already Paid */}
                {selectedPayable.status === 'Paid' && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Cannot Update Status</strong>
                    <span className="block sm:inline"> This payable has already been marked as Paid and cannot be modified.</span>
                  </div>
                )}

                {/* Only show select and update button if not already Paid */}
                {selectedPayable.status !== 'Paid' && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={newStatus}
                        onChange={(e) => {
                          setNewStatus(e.target.value);
                          if (e.target.value !== 'Paid') {
                            setReceiptFile(null); // Clear the file if status is not "Paid"
                          }
                        }}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        {statusOptions.map(status => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Show file input when status is "Paid" */}
                    {newStatus === 'Paid' && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Receipt</label>
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <UploadCloud size={24} className="mb-1 text-gray-500" />
                              <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-gray-500">PNG, JPG or JPEG</p>
                            </div>
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                setReceiptFile(file);
                              }}
                              accept=".jpeg,.jpg,.png"
                            />
                          </label>
                        </div>
                        {receiptFile && (
                          <div className="mt-2 text-sm text-gray-500">
                            Selected file: {receiptFile.name}
                          </div>
                        )}
                        {newStatus === 'Paid' && !receiptFile && (
                          <p className="text-red-500 text-sm mt-2">
                                  A receipt is required when updating status to Paid
                                </p>
                              )}
                            </div>
                          )}

                          {/* Update button with validation */}
                          <button
                            onClick={() => {
                              // Additional validation for file upload when status is Paid
                              if (newStatus === 'Paid' && !receiptFile) {
                                alert('Please upload a receipt when selecting Paid status');
                                return;
                              }

                              updatePayableStatus();
                            }}
                            disabled={newStatus === 'Paid' && !receiptFile}
                            className={`w-full p-2 rounded ${
                              (newStatus === 'Paid' && !receiptFile)
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                          >
                            Update
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-red-500">
                      No payable selected. Please try again.
                    </div>
                  )}
                </Modal>
      </div>
    </div>
  );
}

export default PayableView;