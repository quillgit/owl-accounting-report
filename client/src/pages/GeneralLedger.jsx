import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Search, ArrowRight, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, AlertCircle } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import DatePicker from '../components/DatePicker';

export default function GeneralLedger({ onNavigate }) {
  const [ledgerData, setLedgerData] = useState({ rows: [], balances: [] });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const formatDate = (d) => `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;

    return {
      tgl1: formatDate(start),
      tgl2: formatDate(end),
      pt: '',
      regional: '',
      gudang: '',
      akundari: '',
      akunsampai: ''
    };
  });

  const [options, setOptions] = useState({
    pt: [],
    regional: [],
    gudang: [],
    accounts: []
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    // Fetch Units (Gudang) when Regional or PT changes
    const fetchGudang = async () => {
        try {
            const params = {};
            if (filters.regional) params.regional = filters.regional;
            if (filters.pt) params.pt = filters.pt;

            const res = await axios.get('/api/options/gudang', { params });
            setOptions(prev => ({ ...prev, gudang: res.data }));
        } catch (error) {
            console.error("Failed to fetch units", error);
        }
    };
    fetchGudang();
  }, [filters.regional, filters.pt]);

  const fetchOptions = async () => {
    try {
      const [ptRes, regRes, accRes] = await Promise.all([
        axios.get('/api/options/pt'),
        axios.get('/api/options/regional'),
        axios.get('/api/options/accounts')
      ]);
      setOptions(prev => ({
        ...prev,
        pt: ptRes.data,
        regional: regRes.data,
        accounts: accRes.data
      }));
    } catch (error) {
      console.error("Failed to fetch options", error);
    }
  };

  const handleFetchLedger = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/ledger/report', { params: filters });
      setLedgerData(response.data);
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to fetch ledger", error);
      alert("Error fetching ledger data. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const tableData = useMemo(() => {
    if (!ledgerData.rows.length) return [];
    
    const processed = [];
    const grouped = ledgerData.rows.reduce((acc, row) => {
      if (!acc[row.noakun]) acc[row.noakun] = [];
      acc[row.noakun].push(row);
      return acc;
    }, {});

    const sortedAccounts = Object.keys(grouped).sort();
    let globalNo = 0;

    sortedAccounts.forEach(akun => {
      const balanceInfo = ledgerData.balances.find(b => b.noakun === akun);
      const saldoAwal = balanceInfo ? Number(balanceInfo.saldo_awal) : 0;
      let currentSaldo = saldoAwal;

      // Header Row: Saldo Awal
      processed.push({
        type: 'summary',
        keterangan: 'Saldo Awal',
        noakun: akun,
        saldo: currentSaldo,
        isHeader: true
      });

      // Sort rows
      const rows = grouped[akun].sort((a, b) => {
        if (a.tanggal !== b.tanggal) return a.tanggal.localeCompare(b.tanggal);
        return a.nojurnal.localeCompare(b.nojurnal);
      });

      rows.forEach(r => {
        globalNo++;
        const debet = Number(r.debet);
        const kredit = Number(r.kredit);
        currentSaldo += (debet - kredit);

        processed.push({
          type: 'transaction',
          no: globalNo,
          ...r,
          saldo: currentSaldo
        });
      });

      // Footer Row: Saldo Akhir
      processed.push({
        type: 'summary',
        keterangan: 'Saldo Akhir',
        noakun: akun,
        saldo: currentSaldo,
        isFooter: true
      });
    });

    return processed;
  }, [ledgerData]);

  // Client-side Search Logic
  const filteredTableData = useMemo(() => {
    if (!searchQuery.trim()) return tableData;
    
    const query = searchQuery.toLowerCase();
    return tableData.filter(row => {
        return Object.values(row).some(val => 
            val !== null && 
            val !== undefined && 
            String(val).toLowerCase().includes(query)
        );
    });
  }, [tableData, searchQuery]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredTableData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTableData = showAll ? filteredTableData : filteredTableData.slice(startIndex, endIndex);

  const EXPORT_HEADERS = [
    "No", "No Jurnal", "Tanggal", "No Akun", "Nama Akun",
    "No Arus Kas", "Nama Karyawan", "Kode Customer", "Nama Supplier",
    "No Referensi", "No Dok/Kontrak", "No DO", "No Cek/Giro",
    "Keterangan", "Debet", "Kredit", "Saldo", "Kode Org",
    "Kode Blok", "Tahun Tanam"
  ];

  // Builds xlsx worksheet by writing cells directly — bypasses all helper functions
  // that hit the "too many properties to enumerate" limit on large datasets
  const buildWorksheetDirect = (dataRows) => {
    const ws = {};
    const R = dataRows.length + 1; // +1 for header
    const C = EXPORT_HEADERS.length;

    // Header row
    EXPORT_HEADERS.forEach((h, c) => {
      ws[XLSX.utils.encode_cell({ r: 0, c })] = { v: h, t: 's' };
    });

    // Data rows
    dataRows.forEach((row, ri) => {
      row.forEach((val, c) => {
        const cell = { v: val };
        cell.t = typeof val === 'number' ? 'n' : 's';
        ws[XLSX.utils.encode_cell({ r: ri + 1, c })] = cell;
      });
    });

    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: R - 1, c: C - 1 } });
    return ws;
  };

  const processedToRows = (processed) => processed.map(row => {
    if (row.type === 'summary') {
      return ['', '', '', row.noakun, '', '', '', '', '', '', '', '', '',
              row.keterangan, 0, 0, row.saldo, '', '', ''];
    }
    return [row.no || '', row.nojurnal || '', row.tanggal || '', row.noakun || '',
            row.namaakun || '', row.noaruskas || '', row.namakaryawan || '',
            row.kodecustomer || '', row.namasupplier || '', row.noreferensi || '',
            row.nodok || '', row.nodo || '', row.nocekgiro || '',
            row.keterangan || '', Number(row.debet) || 0, Number(row.kredit) || 0, row.saldo || 0,
            row.kodeorg || '', row.kodeblok || '', row.tahuntanam || ''];
  });

  const handleExportExcel = () => {
    if (!tableData.length) return;
    const wb = XLSX.utils.book_new();
    const ws = buildWorksheetDirect(processedToRows(tableData));
    XLSX.utils.book_append_sheet(wb, ws, "General Ledger");
    XLSX.writeFile(wb, `General_Ledger_${filters.tgl1}_${filters.tgl2}.xlsx`);
  };

  // Direct export without viewing - streams Excel from server
  const handleDirectExport = async () => {
    setExporting(true);
    setExportStatus('Preparing export...');

    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
      );

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/ledger/export?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      setExportStatus('Downloading...');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `General_Ledger_${filters.tgl1}_${filters.tgl2}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);

      // Show popup with download info
      setExportStatus('Export completed! File saved to Downloads folder.');
      setTimeout(() => setExportStatus(''), 5000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('Export failed. Please try again.');
      setTimeout(() => setExportStatus(''), 3000);
    } finally {
      setExporting(false);
    }
  };

  const formatMoney = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between flex-none gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('dashboard')} className="text-gray-400 hover:text-[#875A7B] transition-colors">
            <ArrowRight className="w-6 h-6 rotate-180" />
          </button>
          <h2 className="text-2xl font-semibold whitespace-nowrap">General Ledger Report</h2>
        </div>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search all columns..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#875A7B] focus:border-transparent outline-none shadow-sm"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 space-y-3 flex-none">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
            <DatePicker
              value={filters.tgl1}
              onChange={(val) => setFilters({...filters, tgl1: val})}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
            <DatePicker
              value={filters.tgl2}
              onChange={(val) => setFilters({...filters, tgl2: val})}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">PT / Organization</label>
            <select 
              className="w-full rounded-lg border border-gray-300 py-1.5 px-2 text-xs focus:ring-2 focus:ring-[#875A7B] outline-none"
              value={filters.pt}
              onChange={(e) => setFilters({...filters, pt: e.target.value})}
            >
              <option value="">Select PT</option>
              {options.pt && options.pt.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Regional</label>
            <select 
              className="w-full rounded-lg border border-gray-300 py-1.5 px-2 text-xs focus:ring-2 focus:ring-[#875A7B] outline-none"
              value={filters.regional}
              onChange={(e) => setFilters({...filters, regional: e.target.value, gudang: ''})}
            >
              <option value="">Select Regional</option>
              {options.regional && options.regional.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
            <select 
              className="w-full rounded-lg border border-gray-300 py-1.5 px-2 text-xs focus:ring-2 focus:ring-[#875A7B] outline-none"
              value={filters.gudang}
              onChange={(e) => setFilters({...filters, gudang: e.target.value})}
            >
              <option value="">Select Unit</option>
              {options.gudang && options.gudang.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">From Account (COA)</label>
            <SearchableSelect
              options={options.accounts}
              value={filters.akundari}
              onChange={(val) => setFilters({...filters, akundari: val})}
              placeholder="Start Account"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">To Account (COA)</label>
            <SearchableSelect
              options={options.accounts}
              value={filters.akunsampai}
              onChange={(val) => setFilters({...filters, akunsampai: val})}
              placeholder="End Account"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleFetchLedger}
              disabled={loading || exporting}
              className="w-full bg-[#875A7B] text-white py-1.5 px-4 rounded-lg font-medium hover:bg-[#6d4863] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              Generate
            </button>
          </div>
          <div className="flex items-end">
             <button
                onClick={handleDirectExport}
                disabled={loading || exporting}
                className="w-full bg-emerald-600 text-white py-1.5 px-4 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
             >
                {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Export Direct
             </button>
          </div>
          <div className="flex items-end">
             <button
                onClick={handleExportExcel}
                disabled={loading || exporting || tableData.length === 0}
                className="w-full bg-blue-600 text-white py-1.5 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
             >
                <Download className="w-3.5 h-3.5" />
                Export
             </button>
          </div>
        </div>
      </div>

      {/* Export status notification */}
      {exportStatus && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium flex-none
          ${exportStatus.includes('failed') || exportStatus.includes('No data')
            ? 'bg-red-50 text-red-700 border border-red-200'
            : exportStatus.includes('successfully')
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
          {exporting
            ? <Loader2 className="w-3.5 h-3.5 animate-spin flex-none" />
            : exportStatus.includes('failed') || exportStatus.includes('No data')
              ? <AlertCircle className="w-3.5 h-3.5 flex-none" />
              : <Download className="w-3.5 h-3.5 flex-none" />
          }
          {exportStatus}
        </div>
      )}

      {/* Results */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-auto relative">
          <table className="w-max min-w-full text-xs text-left border-collapse">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200 sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="px-2 py-1.5 border-r border-gray-100 whitespace-nowrap">No</th>
                <th className="px-2 py-1.5 border-r border-gray-100 whitespace-nowrap">No Jurnal</th>
                <th className="px-2 py-1.5 border-r border-gray-100 whitespace-nowrap">Tanggal</th>
                <th className="px-2 py-1.5 border-r border-gray-100 whitespace-nowrap">No Akun</th>
                <th className="px-2 py-1.5 border-r border-gray-100 whitespace-nowrap">Nama Akun</th>
                <th className="px-2 py-1.5 border-r border-gray-100 whitespace-nowrap">No Arus Kas</th>
                <th className="px-2 py-1.5 border-r border-gray-100 whitespace-nowrap">Nama Karyawan</th>
                <th className="px-2 py-1.5 border-r border-gray-100 whitespace-nowrap">Kode Customer</th>
                <th className="px-2 py-1.5 border-r border-gray-100 whitespace-nowrap">Nama Supplier</th>
                <th className="px-2 py-1.5 border-r border-gray-100 whitespace-nowrap">No Referensi</th>
                <th className="px-2 py-1.5 border-r border-gray-100 whitespace-nowrap">No Dok/Kontrak</th>
                <th className="px-2 py-1.5 border-r border-gray-100 whitespace-nowrap">No DO</th>
                <th className="px-2 py-1.5 border-r border-gray-100 whitespace-nowrap">No Cek/Giro</th>
                <th className="px-2 py-1.5 border-r border-gray-100 whitespace-nowrap">Keterangan</th>
                <th className="px-2 py-1.5 text-right border-r border-gray-100 whitespace-nowrap">Debet</th>
                <th className="px-2 py-1.5 text-right border-r border-gray-100 whitespace-nowrap">Kredit</th>
                <th className="px-2 py-1.5 text-right border-r border-gray-100 whitespace-nowrap">Saldo</th>
                <th className="px-2 py-1.5 border-r border-gray-100 whitespace-nowrap">Kode Org</th>
                <th className="px-2 py-1.5 border-r border-gray-100 whitespace-nowrap">Kode Blok</th>
                <th className="px-2 py-1.5 whitespace-nowrap">Tahun Tanam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentTableData.length === 0 ? (
                <tr>
                  <td colSpan="20" className="px-4 py-8 text-center text-gray-400">
                    No data available. Adjust filters and search.
                  </td>
                </tr>
              ) : (
                currentTableData.map((row, idx) => {
                  if (row.type === 'summary') {
                    return (
                      <tr key={idx} className="bg-gray-50 font-semibold text-gray-700 hover:bg-gray-100">
                        <td className="px-2 py-1.5 border-r border-gray-100"></td>
                        <td className="px-2 py-1.5 border-r border-gray-100"></td>
                        <td className="px-2 py-1.5 border-r border-gray-100"></td>
                        <td className="px-2 py-1.5 border-r border-gray-100 text-[#875A7B]">{row.noakun}</td>
                        <td className="px-2 py-1.5 border-r border-gray-100"></td>
                        <td className="px-2 py-1.5 border-r border-gray-100"></td>
                        <td className="px-2 py-1.5 border-r border-gray-100"></td>
                        <td className="px-2 py-1.5 border-r border-gray-100"></td>
                        <td className="px-2 py-1.5 border-r border-gray-100"></td>
                        <td className="px-2 py-1.5 border-r border-gray-100"></td>
                        <td className="px-2 py-1.5 border-r border-gray-100"></td>
                        <td className="px-2 py-1.5 border-r border-gray-100"></td>
                        <td className="px-2 py-1.5 border-r border-gray-100"></td>
                        <td className="px-2 py-1.5 border-r border-gray-100">{row.keterangan}</td>
                        <td className="px-2 py-1.5 text-right border-r border-gray-100 font-mono text-emerald-600">0</td>
                        <td className="px-2 py-1.5 text-right border-r border-gray-100 font-mono text-rose-600">0</td>
                        <td className="px-2 py-1.5 text-right border-r border-gray-100 font-mono">{formatMoney(row.saldo)}</td>
                        <td className="px-2 py-1.5 border-r border-gray-100"></td>
                        <td className="px-2 py-1.5 border-r border-gray-100"></td>
                        <td className="px-2 py-1.5"></td>
                      </tr>
                    );
                  }
                  
                  // Transaction Row
                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-2 py-1.5 border-r border-gray-100 text-center text-gray-500">{row.no}</td>
                      <td className="px-2 py-1.5 border-r border-gray-100 font-mono text-[10px] text-gray-600 whitespace-nowrap">{row.nojurnal}</td>
                      <td className="px-2 py-1.5 border-r border-gray-100 whitespace-nowrap">{row.tanggal}</td>
                      <td className="px-2 py-1.5 border-r border-gray-100 font-medium text-gray-900">{row.noakun}</td>
                      <td className="px-2 py-1.5 border-r border-gray-100 text-[10px] text-gray-600 truncate max-w-[150px]" title={row.namaakun}>{row.namaakun}</td>
                      <td className="px-2 py-1.5 border-r border-gray-100 text-[10px]">{row.noaruskas}</td>
                      <td className="px-2 py-1.5 border-r border-gray-100 text-[10px]">{row.namakaryawan}</td>
                      <td className="px-2 py-1.5 border-r border-gray-100 text-[10px]">{row.kodecustomer}</td>
                      <td className="px-2 py-1.5 border-r border-gray-100 text-[10px] truncate max-w-[120px]">{row.namasupplier}</td>
                      <td className="px-2 py-1.5 border-r border-gray-100 text-[10px]">{row.noreferensi}</td>
                      <td className="px-2 py-1.5 border-r border-gray-100 text-[10px]">{row.nodok}</td>
                      <td className="px-2 py-1.5 border-r border-gray-100 text-[10px]">{row.nodo}</td>
                      <td className="px-2 py-1.5 border-r border-gray-100 text-[10px]">{row.nocekgiro}</td>
                      <td className="px-2 py-1.5 border-r border-gray-100 text-xs truncate max-w-[200px]" title={row.keterangan}>{row.keterangan}</td>
                      <td className="px-2 py-1.5 text-right border-r border-gray-100 font-mono text-emerald-600">{formatMoney(row.debet)}</td>
                      <td className="px-2 py-1.5 text-right border-r border-gray-100 font-mono text-rose-600">{formatMoney(row.kredit)}</td>
                      <td className="px-2 py-1.5 text-right border-r border-gray-100 font-mono font-medium">{formatMoney(row.saldo)}</td>
                      <td className="px-2 py-1.5 border-r border-gray-100 text-[10px]">{row.kodeorg}</td>
                      <td className="px-2 py-1.5 border-r border-gray-100 text-[10px]">{row.kodeblok}</td>
                      <td className="px-2 py-1.5 text-[10px]">{row.tahuntanam}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="border-t border-gray-200 bg-gray-50 p-2 flex items-center justify-between text-xs flex-none z-10">
          <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 mr-4 border-r pr-4 border-gray-300">
                  <input 
                      type="checkbox" 
                      id="showAll" 
                      checked={showAll} 
                      onChange={(e) => setShowAll(e.target.checked)}
                      className="rounded border-gray-300 text-[#875A7B] focus:ring-[#875A7B]"
                  />
                  <label htmlFor="showAll" className="text-gray-600 select-none cursor-pointer">Show All</label>
              </div>
              <span className="text-gray-500">Rows:</span>
              <select 
                  className="border border-gray-300 rounded px-1 py-0.5 outline-none focus:border-[#875A7B] bg-white disabled:opacity-50"
                  value={itemsPerPage}
                  onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                  }}
                  disabled={showAll}
              >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={500}>500</option>
                  <option value={1000}>1000</option>
              </select>
              <span className="text-gray-500 ml-2">
                  {showAll ? (
                      `Showing all ${filteredTableData.length} rows`
                  ) : (
                      `${startIndex + 1}-${Math.min(endIndex, filteredTableData.length)} / ${filteredTableData.length}`
                  )}
              </span>
          </div>
          <div className="flex items-center gap-1">
              <button 
                  onClick={() => setCurrentPage(1)} 
                  disabled={currentPage === 1 || showAll}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                  <ChevronsLeft className="w-4 h-4" />
              </button>
              <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                  disabled={currentPage === 1 || showAll}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                  <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="mx-2 font-medium text-gray-700 min-w-[3rem] text-center">
                  {showAll ? 'All' : `${currentPage} / ${totalPages || 1}`}
              </span>
              <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                  disabled={currentPage === totalPages || totalPages === 0 || showAll}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                  <ChevronRight className="w-4 h-4" />
              </button>
              <button 
                  onClick={() => setCurrentPage(totalPages)} 
                  disabled={currentPage === totalPages || totalPages === 0 || showAll}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                  <ChevronsRight className="w-4 h-4" />
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}
