import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import PayableView from '../views/PayableView';
import '../styles/transactionHistory.css';
import Modal from "react-modal";
import TransactionHistory from './TransactionHistory';
import api from '../axiosConfig';
import { CheckCircle, RefreshCw, Download } from "lucide-react";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoData from '../assets/images/gamma.png';
function OtherPayables() {
  const [otherpayables, setOtherPayables] = useState([]);
  const [filteredPayables, setFilteredPayables] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('OtherPayables');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadLoading, setDownloadLoading] = useState(false);
  
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [appliedFilter, setAppliedFilter] = useState({ startDate: '', endDate: '' });

  const fetchTransactions = async (page, filters) => {
    try {
      setLoading(true);
      let url = `http://192.168.254.192:8000/api/otherpayables?page=${page}`
      if (filters?.startDate && filters?.endDate) {
        url += `&start_date=${filters.startDate}&end_date=${filters.endDate}`;
      }
      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      
      if (response.data.data) {
        setOtherPayables(response.data.data);
        setFilteredPayables(response.data.data);
        setTotalPages(response.data.last_page);
      } else {
        setOtherPayables([]);
        setFilteredPayables([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setOtherPayables([]);
      setFilteredPayables([]);
      setError('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch all data for PDF download
  const fetchAllData = async (filters) => {
    try {
      setDownloadLoading(true);
      let url = `http://192.168.254.192:8000/api/otherpayables?per_page=1000`; // Get a large number of records
      
      if (filters?.startDate && filters?.endDate) {
        url += `&start_date=${filters.startDate}&end_date=${filters.endDate}`;
      }
      
      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      
      let allData = response.data.data || [];
      
      // Apply search filter if needed
      if (searchQuery.trim() !== '') {
        allData = allData.filter(payable => 
          payable.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payable.lab.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      return allData;
    } catch (err) {
      console.error('Error fetching all data for download:', err);
      return [];
    } finally {
      setDownloadLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
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
  
  const handleDownload = async () => {
    try {
      const dataToDownload = await fetchAllData(appliedFilter);
      
      if (dataToDownload.length === 0) {
        alert('No data to download.');
        return;
      }
      
      const doc = new jsPDF();
      
      // Add the GammaCare logo from imported image
      // First, create an image element to load the logo
      const img = new Image();
      img.src = logoData;
      
      // When image loads, add it to the PDF
      img.onload = function() {
        // Add logo
        const logoWidth = 50;
        const logoHeight = 20;
        doc.addImage(img, 'PNG', 14, 10, logoWidth, logoHeight);
        
        
        
        // Add horizontal line
        doc.setDrawColor(200, 200, 200);
        doc.line(14, 35, 196, 35);
        
        // Add title
        doc.setFontSize(18);
        doc.setTextColor(0, 0, 0); // Black color for titles
        doc.text("Recievables Reports", 14, 45);
        
        // Add subtitle
        doc.setFontSize(11);
        doc.setTextColor(90, 90, 90); // Dark gray for subtitle
        const subtitle = searchQuery 
          ? `Filtered by: ${searchQuery}` 
          : appliedFilter.startDate && appliedFilter.endDate 
            ? `Date Range: ${format(new Date(appliedFilter.startDate), 'MMM dd, yyyy')} - ${format(new Date(appliedFilter.endDate), 'MMM dd, yyyy')}` 
            : 'All Records';
        doc.text(subtitle, 14, 55);
        
        // Add generation date
        doc.setFontSize(10);
        doc.text(`Generated on: ${format(new Date(), 'MMM dd, yyyy')}`, 14, 62);
        
        // Prepare table data
        const tableData = dataToDownload.map(item => [
          format(new Date(item.date), 'MMM dd, yyyy'),
          item.city,
          item.lab,
          item.address,
          new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(item.amount_paid),
          item.mode_of_payment,
          item.account_number || 'N/A',
          item.received_by
        ]);
        
        // Create table with styling to match the design
        autoTable(doc, {
          head: [['Date', 'City', 'Laboratory', 'Address', 'Amount Paid', 'Mode of Payment', 'Account Number', 'Received by']],
          body: tableData,
          startY: 68,
          styles: { 
            fontSize: 9,
            cellPadding: 3,
            overflow: 'linebreak',
            lineColor: [220, 220, 220]
          },
          headStyles: {
            fillColor: [44, 94, 46], // Green header matching GammaCare branding
            textColor: [255, 255, 255],
            halign: 'left',
            fontStyle: 'normal',
            lineWidth: 0.1
          },
          columnStyles: {
            0: { cellWidth: 22 }, // Date
            1: { cellWidth: 20 }, // City
            2: { cellWidth: 25 }, // Laboratory
            3: { cellWidth: 25 }, // Address
            4: { cellWidth: 25 }, // Amount Paid
            5: { cellWidth: 25 }, // Mode of Payment
            6: { cellWidth: 20 }, // Account Number
            7: { cellWidth: 22 }  // Received by
          },
          alternateRowStyles: {
            fillColor: [242, 242, 242] // Light gray for alternate rows
          },
          didParseCell: function(data) {
            // Make header text bold
            if (data.section === 'head') {
              data.cell.styles.fontStyle = 'bold';
            }
          }
        });
        
        // Calculate total amount
        const totalAmount = dataToDownload.reduce((sum, item) => sum + parseFloat(item.amount_paid), 0);
        
        // Add total amount
        const finalY = doc.lastAutoTable.finalY || 68;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Total Amount: ${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(totalAmount)}`, 14, finalY + 10);
        
        // Save the PDF
        doc.save(`Receivables_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      };
      
      // Handle image loading errors
      img.onerror = function() {
        console.error('Error loading logo image');
        // Continue without the logo
        generatePDFWithoutLogo();
      };
      
      // Fallback function if logo fails to load
      function generatePDFWithoutLogo() {
        // Add title (without logo)
        doc.setFontSize(18);
        doc.setTextColor(29, 66, 138); // Dark blue color for "GAMMACARE"
        doc.text("GAMMACARE", 14, 15);
        
        doc.setFontSize(12);
        doc.setTextColor(44, 94, 46); // Green color for "Medical Services Inc."
        doc.text("Medical Services Inc.", 14, 22);
        
        // Continue with the rest of the PDF generation...
        // (Same code as above, just with adjusted positioning)
        
        // ...
        
        // Save the PDF
        doc.save(`Receivables_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };
  useEffect(() => {
    if (viewMode === 'OtherPayables') {
      fetchTransactions(currentPage, appliedFilter);
    }
  }, [currentPage, appliedFilter, viewMode]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPayables(otherpayables);
    } else {
      setFilteredPayables(
        otherpayables.filter(payable => 
          payable.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payable.lab.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, otherpayables]);
  
  const handleViewModeChange = (e) => {
    setViewMode(e.target.value);
  };

  // Early returns for alternative view modes
  if (viewMode === 'Payables') {
    return <PayableView closeModal={() => setViewMode('OtherPayables')} />;
  }

  if (viewMode === 'Transaction') {
    return <TransactionHistory closeModal={() => setViewMode('OtherPayables')} />;
  }

  // Table Row Skeleton component
  const TableRowSkeleton = ({ rowCount = 8 }) => {
    return (
      <>
        {[...Array(rowCount)].map((_, index) => (
          <tr key={`skeleton-row-${index}`} className="skeleton-row">
            {[...Array(8)].map((_, cellIndex) => (
              <td key={`skeleton-cell-${index}-${cellIndex}`} className="skeleton-cell">
                <Skeleton />
              </td>
            ))}
          </tr>
        ))}
      </>
    );
  };

  return (
    <div className="transaction-containers">
      <div className="content-wrapper">
        <div className="filters-section">
          <form onSubmit={handleFilterSubmit} className="date-filters">
            <div className="filter-group">
              <input 
                type="text" 
                placeholder="Search by City or Laboratory..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="search-bar lg:w-[100px]"
              />
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
                onClick={handleDownload}
                disabled={downloadLoading}
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
                {['Date', 'City', 'Laboratory', 'Address', 'Amount Paid', 'Mode of payment', 'Account Number', 'Received by'].map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowSkeleton rowCount={8} />
              ) : filteredPayables.length > 0 ? (
                filteredPayables.map((otherpayable) => (
                  <tr key={otherpayable.id}>
                    <td>{format(new Date(otherpayable.date), 'MMM dd, yyyy')}</td>
                    <td>{otherpayable.city}</td>
                    <td>{otherpayable.lab}</td>
                    <td>{otherpayable.address}</td>
                    <td>{new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(otherpayable.amount_paid)}</td>
                    <td>{otherpayable.mode_of_payment}</td>
                    <td>{otherpayable.account_number || 'N/A'}</td>
                    <td>{otherpayable.received_by}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="no-data">No transactions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
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

              // Always show first two pages
              if (currentPage <= 2) {
                pageNumbers.push(
                  <button
                    key={1}
                    onClick={() => handlePageChange(1)}
                    className={`page-button ${currentPage === 1 ? 'active' : ''}`}
                  >
                    1
                  </button>,
                  <button
                    key={2}
                    onClick={() => handlePageChange(2)}
                    className={`page-button ${currentPage === 2 ? 'active' : ''}`}
                  >
                    2
                  </button>
                );

                // Add ellipsis if more pages exist
                if (totalPages > 2) {
                  pageNumbers.push(
                    <span key="ellipsis" className="page-ellipsis">
                      ...
                    </span>
                  );
                }
              } 
              // Show last two pages
              else if (currentPage >= totalPages - 1) {
                if (totalPages > 2) {
                  pageNumbers.push(
                    <span key="ellipsis" className="page-ellipsis">
                      ...
                    </span>
                  );
                }

                pageNumbers.push(
                  <button
                    key={totalPages - 1}
                    onClick={() => handlePageChange(totalPages - 1)}
                    className={`page-button ${currentPage === totalPages - 1 ? 'active' : ''}`}
                  >
                    {totalPages - 1}
                  </button>,
                  <button
                    key={totalPages}
                    onClick={() => handlePageChange(totalPages)}
                    className={`page-button ${currentPage === totalPages ? 'active' : ''}`}
                  >
                    {totalPages}
                  </button>
                );
              }
              // For pages in the middle
              else {
                pageNumbers.push(
                  <span key="start-ellipsis" className="page-ellipsis">
                    ...
                  </span>,
                  <button
                    key={currentPage}
                    onClick={() => handlePageChange(currentPage)}
                    className="page-button active"
                  >
                    {currentPage}
                  </button>,
                  <span key="end-ellipsis" className="page-ellipsis">
                    ...
                  </span>
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
    </div>
  );
}

export default OtherPayables;