import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import PayableView from '../views/PayableView';
import '../styles/transactionHistory.css';
import Modal from "react-modal";
import OtherPayables from './OthersPayables';
import api from '../axiosConfig';
import { Eye, CheckCircle, RefreshCw, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import logoData from '../assets/images/gamma.png';
function TransactionHistory() {
  // All your existing state variables
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  
  // State for image zoom functionality
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  // Replace modalIsOpenPayables with viewMode
  const [viewMode, setViewMode] = useState('Transaction');
  
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [appliedFilter, setAppliedFilter] = useState({ startDate: '', endDate: '' });
  const [downloadLoading, setDownloadLoading] = useState(false);
  
  // All your existing functions
  const fetchTransactions = async (page, filters) => {
    try {
      setLoading(true);

      // Retrieve token from localStorage
      const token = localStorage.getItem('auth_token'); // Ensure correct key
      if (!token) {
        throw new Error('Authentication required');
      }

      let url = `/transactions?page=${page}`; // Use relative URL if Axios baseURL is set
  
      if (filters.startDate && filters.endDate) {
        url += `&start_date=${filters.startDate}&end_date=${filters.endDate}`;
      }

      const response = await api.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setTransactions(response.data.data);
      setTotalPages(Math.ceil(response.data.total / response.data.per_page));
    } catch (err) {
      console.error('Error fetching transactions:', err.response?.data || err.message);
      setError('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'Transaction') {
      fetchTransactions(currentPage, appliedFilter);
    } else {
      // Clear transactions when not in Transaction view
      setTransactions([]);
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

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
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
 
  const openModal = (receiptPath) => {
    const baseUrl = "http://192.168.254.192:8000/storage/receipts/";
    const finalUrl = receiptPath.startsWith("http") ? receiptPath : `${baseUrl}${receiptPath}`;
    setSelectedReceipt(finalUrl);
    setModalIsOpen(true);
    // Reset zoom and position when opening a new receipt
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };
  
  const closeModal = () => {
    setSelectedReceipt(null);
    setModalIsOpen(false);
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

  const handleDownloadPDF = async () => {
    try {
      setDownloadLoading(true);
      
      // Fetch all transactions with current filter
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }
  
      // Construct URL with filters but no pagination
      let url = `/transactions/all`;
      
      if (appliedFilter.startDate && appliedFilter.endDate) {
        url += `?start_date=${appliedFilter.startDate}&end_date=${appliedFilter.endDate}`;
      }
  
      const response = await api.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      // Generate PDF with jsPDF
      const doc = new jsPDF();
  
      // Add logo
      // You'll need to have this image available as a base64 string or URL
      const logoWidth = 60;
      const logoHeight = 30;
      doc.addImage(logoData, 'PNG', 14, 10, logoWidth, logoHeight);
  
      // Add title to PDF
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0);
      doc.text('Transaction History Report', 14, 50);
  
      // Add date range if applied
      if (appliedFilter.startDate && appliedFilter.endDate) {
        doc.setFontSize(12);
        doc.text(`Date Range: ${formatDate(appliedFilter.startDate)} to ${formatDate(appliedFilter.endDate)}`, 14, 58);
      }
  
      // Add generation date
      doc.setFontSize(10);
      doc.text(`Generated on: ${formatDate(new Date().toISOString())}`, 14, 65);
  
      // Define columns for the table
      const columns = [
        { header: 'Date', dataKey: 'date' },
        { header: 'Name', dataKey: 'name' },
        { header: 'Company', dataKey: 'company' },
        { header: 'Amount', dataKey: 'amount' },
        { header: 'Payment Type', dataKey: 'type' },
        { header: 'Description', dataKey: 'description' }
      ];
  
      // Format data for the table
      const data = response.data.map(transaction => ({
        date: formatDate(transaction.date),
        name: transaction.name,
        company: transaction.company,
        amount: transaction.cost_or_income.toLowerCase() === "expenses" 
          ? `-${formatAmount(transaction.amount)}` 
          : `${formatAmount(transaction.amount)}`,
        type: transaction.type_of_payment,
        description: transaction.description
      }));
  
      // Use autoTable with GammaCare green style
      autoTable(doc, {
        startY: 70,
        head: [columns.map(col => col.header)],
        body: data.map(item => columns.map(col => item[col.dataKey])),
        styles: { 
          overflow: 'linebreak', 
          cellWidth: 'auto',
          cellPadding: 4
        },
        columnStyles: {
          date: { cellWidth: 25 },
          amount: { cellWidth: 25, halign: 'right' },
          description: { cellWidth: 40 }
        },
        headStyles: { 
          fillColor: [45, 87, 44],  // Green color matching GammaCare
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        }
      });
  
      // Save the PDF
      const fileName = appliedFilter.startDate && appliedFilter.endDate 
        ? `transactions_${appliedFilter.startDate}_to_${appliedFilter.endDate}.pdf` 
        : `transactions_all_time.pdf`;
        
      doc.save(fileName);
          
    } catch (err) {
      console.error('Error downloading transactions:', err.response?.data || err.message);
      alert('Failed to download transactions report');
    } finally {
      setDownloadLoading(false);
    }
  };

  // Early returns for alternative view modes
  if (viewMode === 'Payables') {
    return <PayableView closeModal={() => setViewMode('Transaction')} />;
  }

  if (viewMode === 'OtherPayables') {
    return <OtherPayables closeModal={() => setViewMode('Transaction')} />;
  }

  // Loading and error states
  if (error) {
    return <div className="error-message">{error}</div>;
  }

  // New function to render table skeleton loading state
  const renderTableSkeleton = () => {
    return Array(7).fill().map((_, i) => (
      <tr key={`skeleton-row-${i}`}>
        <td><Skeleton /></td>
        <td><Skeleton /></td>
        <td><Skeleton /></td>
        <td><Skeleton /></td>
        <td><Skeleton /></td>
        <td><Skeleton /></td>
        <td><Skeleton width={25} height={25} circle /></td>
      </tr>
    ));
  };

  // Main return for Transaction view
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
                title='Download Transactions Report'
                onClick={handleDownloadPDF}
                disabled={downloadLoading}
              >
                <Download size={22} />
              </button>
            </div>
            <div className="view-select-container">
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
                {['Date', 'Name', 'Company', 'Amount', 'Payment Type', 'Description', 'Receipt'].map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Skeleton loading state
                renderTableSkeleton()
              ) : transactions.length > 0 ? (
                // Actual transaction data
                transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{formatDate(transaction.date)}</td>
                    <td>{transaction.name}</td>
                    <td>{transaction.company}</td>
                    <td className={transaction.cost_or_income.toLowerCase() === "expenses" ? "expenses-amount" : "income-amount"}>
                      {transaction.cost_or_income.toLowerCase() === "expenses" 
                        ? `-${formatAmount(transaction.amount)}` 
                        : `${formatAmount(transaction.amount)}`
                      }
                    </td>
                    <td>{transaction.type_of_payment}</td>
                    <td>{transaction.description}</td>
                    <td>
                      {transaction.receipt ? (
                        <button onClick={() => openModal(transaction.receipt)} className="p-1 text-blue-600 hover:text-blue-800 cursor-pointer">
                          <Eye size={25} />
                        </button>
                      ) : (
                        "No Receipt"
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                // No data state
                <tr>
                  <td colSpan="8" className="no-data">
                    No transactions found for the selected date range
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination skeleton when loading */}
        {loading ? (
          <div className="pagination">
            <Skeleton width={100} height={38} />
            <div style={{ display: 'flex', gap: '8px' }}>
              {Array(5).fill().map((_, i) => (
                <Skeleton key={`page-skeleton-${i}`} width={38} height={38} />
              ))}
            </div>
            <Skeleton width={100} height={38} />
          </div>
        ) : totalPages > 1 && (
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
      </div>

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
    </div>
  );
}

export default TransactionHistory;