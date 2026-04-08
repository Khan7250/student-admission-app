import React, { useState } from 'react';
import axios from 'axios';
import { Download, FileDown, Printer, Filter } from 'lucide-react';

export default function Reports() {
  const [reportType, setReportType] = useState('daily-followups');
  const [params, setParams] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: ''
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async (e) => {
    e?.preventDefault();
    setLoading(true);
    
    let url = `/reports/${reportType}?startDate=${params.startDate}&endDate=${params.endDate}`;
    if (params.status) {
      url += `&status=${params.status}`;
    }

    try {
      const response = await axios.get(url);
      setData(response.data);
    } catch (error) {
      console.error("Failed to fetch report", error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!data || data.length === 0) return;
    
    // Get headers
    const headers = Object.keys(data[0]);
    let csvRows = [];
    
    // Add header row
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        let val = row[header] === null ? '' : row[header];
        // Escape quotes and wrap in quotes for CSV
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${new Date().getTime()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="print:hidden">
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Generate and export performance reports.</p>
      </div>

      <div className="card p-5 print:hidden">
        <form onSubmit={fetchReport} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              className="input-field bg-white py-2"
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value);
                setData(null);
              }}
            >
              <option value="daily-followups">Daily Follow-up Report</option>
              <option value="enrollments">Monthly Enrollment Report</option>
              <option value="new-entries">New Entries Report</option>
            </select>
          </div>

          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              required
              className="input-field py-2"
              value={params.startDate}
              onChange={(e) => setParams({...params, startDate: e.target.value})}
            />
          </div>
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              required
              className="input-field py-2"
              value={params.endDate}
              onChange={(e) => setParams({...params, endDate: e.target.value})}
            />
          </div>
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status (Optional)</label>
            <select
              className="input-field bg-white py-2"
              value={params.status}
              onChange={(e) => setParams({...params, status: e.target.value})}
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Pending">Pending</option>
              <option value="Enrolled">Enrolled</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="w-full md:w-auto flex-1 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary py-2 px-6 flex items-center justify-center gap-2"
            >
              <Filter size={18} />
              {loading ? 'Loading...' : 'Generate'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; font-size: 12pt; }
          .print\\:hidden { display: none !important; }
          .card { border: none; box-shadow: none; margin: 0; padding: 0; }
        }
      `}</style>

      {/* Report Results */}
      {data && (
        <div className="card shadow-sm animate-fade-in print:block">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center print:border-b-2 print:border-black">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Report Results</h2>
              <p className="text-sm text-gray-500 print:text-black">
                {reportType.replace('-', ' ')} • {data.length} records found
              </p>
            </div>
            
            <div className="flex gap-2 print:hidden">
              <button onClick={exportCSV} className="btn-secondary py-1.5 px-3 text-sm flex gap-2">
                 <FileDown size={16} className="text-gray-500" /> Export CSV / Excel
              </button>
              <button onClick={handlePrint} className="btn-secondary py-1.5 px-3 text-sm flex gap-2">
                 <Printer size={16} className="text-gray-500" /> Print PDF
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {data.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No data available for the selected criteria.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 print:bg-gray-100">
                  <tr>
                    {Object.keys(data[0]).map((key) => (
                      <th key={key} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      {Object.values(row).map((val, cellIdx) => (
                        <td key={cellIdx} className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">
                          {val || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
