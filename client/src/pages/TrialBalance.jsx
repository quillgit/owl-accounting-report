import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Search, ArrowRight, Loader2, Download, Filter, X, Calendar, ListFilter } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import DatePicker from '../components/DatePicker';
import OdooSearch from '../components/OdooSearch';
import AccountDetailTab from './AccountDetailTab';

export default function TrialBalance({ onNavigate }) {
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState('main');

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchState, setSearchState] = useState({ text: '', filters: [] });
  const [rangeType, setRangeType] = useState('period'); // 'period' or 'date'

  const [filters, setFilters] = useState(() => {
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return {
      periodFrom: `${currentMonth}-${year}`,
      periodTo: `${currentMonth}-${year}`,
      tgl1: '',
      tgl2: '',
      pt: '',
      regional: '',
      gudang: '',
      revisi: '',
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

  const handleFetch = async () => {
    if (rangeType === 'period') {
        if (!filters.periodFrom || !filters.periodTo) {
            alert("Please select period range");
            return;
        }
    } else {
        if (!filters.tgl1 || !filters.tgl2) {
            alert("Please select date range");
            return;
        }
    }
    
    setLoading(true);
    try {
      const params = { ...filters };
      
      if (rangeType === 'period') {
        const [m1, y1] = filters.periodFrom.split('-');
        const [m2, y2] = filters.periodTo.split('-');
        params.periodFrom = `${y1}-${m1}`;
        params.periodTo = `${y2}-${m2}`;
        // Remove date range params if using period
        delete params.tgl1;
        delete params.tgl2;
      } else {
        // Using date range (tgl1, tgl2 already in dd-mm-yyyy)
        // Remove period params if using date range
        delete params.periodFrom;
        delete params.periodTo;
      }

      const response = await axios.get('/api/trial-balance/report', { params });
      setData(response.data);
    } catch (error) {
      console.error("Failed to fetch trial balance", error);
      alert("Error fetching data. Check console.");
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (row) => {
      let formattedFilters = { ...filters };

      if (rangeType === 'period') {
          const [m1, y1] = filters.periodFrom.split('-');
          const [m2, y2] = filters.periodTo.split('-');
          formattedFilters.periodFrom = `${y1}-${m1}`;
          formattedFilters.periodTo = `${y2}-${m2}`;
          delete formattedFilters.tgl1;
          delete formattedFilters.tgl2;
      } else {
          delete formattedFilters.periodFrom;
          delete formattedFilters.periodTo;
      }

      const newTabId = `acc-${row.noakun}`;
      if (!tabs.find(t => t.id === newTabId)) {
          setTabs([...tabs, { 
              id: newTabId, 
              title: `${row.noakun}`, 
              type: 'detail',
              account: row,
              filters: formattedFilters,
              orgFilters: {
                  pt: filters.pt,
                  regional: filters.regional,
                  gudang: filters.gudang
              }
          }]);
      }
      setActiveTabId(newTabId);
  };

  const closeTab = (e, id) => {
      e.stopPropagation();
      const newTabs = tabs.filter(t => t.id !== id);
      setTabs(newTabs);
      if (activeTabId === id) {
          setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : 'main');
      }
  };

  const filteredData = useMemo(() => {
    let result = data;

    if (searchState.text) {
        const q = searchState.text.toLowerCase();
        result = result.filter(row => 
          row.noakun.toLowerCase().includes(q) || 
          row.namaakun.toLowerCase().includes(q)
        );
    }

    if (searchState.filters && searchState.filters.length > 0) {
        searchState.filters.forEach(f => {
            if (f.field === 'noakun') {
                result = result.filter(row => row.noakun.toLowerCase().includes(f.value.toLowerCase()));
            } else if (f.field === 'namaakun') {
                result = result.filter(row => row.namaakun.toLowerCase().includes(f.value.toLowerCase()));
            }
        });
    }

    return result;
  }, [data, searchState]);

  const totals = useMemo(() => {
    return filteredData.reduce((acc, row) => ({
      awal: acc.awal + row.awal,
      debet: acc.debet + row.debet,
      kredit: acc.kredit + row.kredit,
      akhir_debet: acc.akhir_debet + row.akhir_debet,
      akhir_kredit: acc.akhir_kredit + row.akhir_kredit,
      akhir_net: acc.akhir_net + row.akhir_net
    }), { awal: 0, debet: 0, kredit: 0, akhir_debet: 0, akhir_kredit: 0, akhir_net: 0 });
  }, [filteredData]);

  const handleExportExcel = () => {
    if (!filteredData.length) return;
    const exportData = filteredData.map(row => ({
      "No Akun": row.noakun,
      "Nama Akun": row.namaakun,
      "Saldo Awal": row.awal,
      "Debet": row.debet,
      "Kredit": row.kredit,
      "Saldo Akhir Debet": row.akhir_debet,
      "Saldo Akhir Kredit": row.akhir_kredit,
      "Saldo Akhir Net": row.akhir_net
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trial Balance");
    XLSX.writeFile(wb, "Trial_Balance.xlsx");
  };

  const fmt = (n) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2 }).format(n);

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      
      {/* Tab Header */}
      <div className="flex bg-gray-100 border-b border-gray-200 overflow-x-auto no-scrollbar relative z-30 shadow-sm flex-none">
          <button
              onClick={() => setActiveTabId('main')}
              className={`px-4 py-3 text-sm font-medium border-r border-gray-200 flex items-center gap-2 whitespace-nowrap transition-colors
                  ${activeTabId === 'main' 
                      ? 'bg-white text-[#875A7B] border-t-2 border-t-[#875A7B]' 
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
          >
              <Filter className="w-4 h-4" />
              Trial Balance
          </button>
          {tabs.map(tab => (
              <div 
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`group px-4 py-3 text-sm font-medium border-r border-gray-200 flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors
                      ${activeTabId === tab.id 
                          ? 'bg-white text-[#875A7B] border-t-2 border-t-[#875A7B]' 
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
              >
                  <span className="max-w-[150px] truncate" title={tab.account.namaakun}>
                      {tab.title} - {tab.account.namaakun}
                  </span>
                  <button 
                      onClick={(e) => closeTab(e, tab.id)}
                      className="p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                      <X className="w-3 h-3" />
                  </button>
              </div>
          ))}
      </div>

      {/* Main Tab Content */}
      <div className={`${activeTabId === 'main' ? 'flex flex-col flex-1 min-h-0 overflow-hidden' : 'hidden'}`}>
          {/* Header & Filters */}
          <div className="p-5 border-b border-gray-200 space-y-4 flex-none bg-gray-50/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="p-1.5 bg-purple-100 rounded-lg text-[#875A7B]">
                    <Filter className="w-5 h-5" />
                  </span>
                  Trial Balance
                </h2>
                <p className="text-sm text-gray-500 mt-1">Neraca Saldo - Period Summary</p>
              </div>
              <div className="flex items-center gap-3">
                 <button 
                   onClick={handleExportExcel}
                   disabled={!filteredData.length}
                   className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
                 >
                   <Download className="w-4 h-4" />
                   Export Excel
                 </button>
                 <div className="w-72">
                    <OdooSearch 
                        onSearch={setSearchState} 
                        placeholder="Search Account..." 
                        searchableFields={[
                            { key: 'noakun', label: 'Account No' },
                            { key: 'namaakun', label: 'Account Name' }
                        ]}
                    />
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {rangeType === 'period' ? 'Period Range' : 'Date Range'}
                        </label>
                        <button 
                            onClick={() => setRangeType(prev => prev === 'period' ? 'date' : 'period')}
                            className="text-[10px] text-[#875A7B] hover:underline flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100"
                        >
                            {rangeType === 'period' ? <Calendar className="w-3 h-3" /> : <ListFilter className="w-3 h-3" />}
                            {rangeType === 'period' ? 'Switch to Dates' : 'Switch to Months'}
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        {rangeType === 'period' ? (
                            <>
                                <DatePicker 
                                    value={filters.periodFrom} 
                                    onChange={(d) => setFilters(prev => ({ ...prev, periodFrom: d }))} 
                                    placeholder="From (MM-YYYY)" 
                                    showMonthYearPicker 
                                    className="w-full"
                                />
                                <span className="text-gray-400">-</span>
                                <DatePicker 
                                    value={filters.periodTo} 
                                    onChange={(d) => setFilters(prev => ({ ...prev, periodTo: d }))} 
                                    placeholder="To (MM-YYYY)" 
                                    showMonthYearPicker 
                                    className="w-full"
                                />
                            </>
                        ) : (
                            <>
                                <DatePicker 
                                    value={filters.tgl1} 
                                    onChange={(d) => setFilters(prev => ({ ...prev, tgl1: d }))} 
                                    placeholder="DD-MM-YYYY" 
                                    showMonthYearPicker={false}
                                    className="w-full"
                                />
                                <span className="text-gray-400">-</span>
                                <DatePicker 
                                    value={filters.tgl2} 
                                    onChange={(d) => setFilters(prev => ({ ...prev, tgl2: d }))} 
                                    placeholder="DD-MM-YYYY" 
                                    showMonthYearPicker={false}
                                    className="w-full"
                                />
                            </>
                        )}
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Organization</label>
                    <div className="grid grid-cols-2 gap-2">
                         <SearchableSelect
                            options={options.regional}
                            value={filters.regional}
                            onChange={(val) => setFilters(prev => ({ ...prev, regional: val }))}
                            placeholder="Regional"
                            className="text-xs"
                        />
                        <SearchableSelect
                            options={options.pt}
                            value={filters.pt}
                        onChange={(val) => setFilters(prev => ({ ...prev, pt: val }))}
                        placeholder="PT"
                        className="text-xs"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit & Revision</label>
                <div className="grid grid-cols-2 gap-2">
                    <SearchableSelect
                        options={options.gudang}
                        value={filters.gudang}
                        onChange={(val) => setFilters(prev => ({ ...prev, gudang: val }))}
                        placeholder="Unit (Gudang)"
                        className="text-xs"
                    />
                    <input 
                        type="number"
                        placeholder="Rev (Opt)"
                        value={filters.revisi}
                        onChange={(e) => setFilters(prev => ({ ...prev, revisi: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 py-1.5 px-3 text-xs focus:ring-2 focus:ring-[#875A7B] outline-none"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">COA Range</label>
                <div className="grid grid-cols-2 gap-2">
                     <SearchableSelect
                        options={options.accounts}
                        value={filters.akundari}
                        onChange={(val) => setFilters(prev => ({ ...prev, akundari: val }))}
                        placeholder="From Account"
                        className="text-xs"
                    />
                    <SearchableSelect
                        options={options.accounts}
                        value={filters.akunsampai}
                        onChange={(val) => setFilters(prev => ({ ...prev, akunsampai: val }))}
                        placeholder="To Account"
                        className="text-xs"
                    />
                </div>
            </div>
        </div>

        <div className="flex justify-end pt-2">
            <button 
                onClick={handleFetch}
                disabled={loading}
                className="bg-[#875A7B] text-white px-8 py-2.5 rounded-lg font-semibold hover:bg-[#6a4661] disabled:opacity-70 transition-all shadow-md flex items-center gap-2"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                Generate Report
            </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto bg-gray-50 p-2">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden min-w-full">
             <table className="w-full text-xs text-left">
                <thead className="text-[10px] text-gray-700 uppercase bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                    <tr>
                        <th className="px-2 py-2 font-bold w-24">No Akun</th>
                        <th className="px-2 py-2 font-bold">Nama Akun</th>
                        <th className="px-2 py-2 font-bold text-right">Saldo Awal</th>
                        <th className="px-2 py-2 font-bold text-right text-blue-600">Debet</th>
                        <th className="px-2 py-2 font-bold text-right text-red-600">Kredit</th>
                        <th className="px-2 py-2 font-bold text-right">S.Akhir Debet</th>
                        <th className="px-2 py-2 font-bold text-right">S.Akhir Kredit</th>
                        <th className="px-2 py-2 font-bold text-right">S.Akhir Net</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[11px]">
                    {loading ? (
                        <tr>
                            <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-[#875A7B]" />
                                    <p>Loading data...</p>
                                </div>
                            </td>
                        </tr>
                    ) : filteredData.length === 0 ? (
                        <tr>
                            <td colSpan="8" className="px-6 py-12 text-center text-gray-500 italic">
                                No data found. Adjust filters and click Generate.
                            </td>
                        </tr>
                    ) : (
                        <>
                            {filteredData.map((row, idx) => (
                                <tr 
                                    key={row.noakun} 
                                    onClick={() => handleRowClick(row)}
                                    className="hover:bg-purple-50/30 transition-colors cursor-pointer"
                                >
                                    <td className="px-2 py-1 font-medium text-gray-900">{row.noakun}</td>
                                    <td className="px-2 py-1 text-gray-600 truncate max-w-[200px]" title={row.namaakun}>{row.namaakun}</td>
                                    <td className="px-2 py-1 text-right font-mono text-gray-700">{fmt(row.awal)}</td>
                                    <td className="px-2 py-1 text-right font-mono text-blue-600">{fmt(row.debet)}</td>
                                    <td className="px-2 py-1 text-right font-mono text-red-600">{fmt(row.kredit)}</td>
                                    <td className="px-2 py-1 text-right font-mono text-gray-800">{fmt(row.akhir_debet)}</td>
                                    <td className="px-2 py-1 text-right font-mono text-gray-800">{fmt(row.akhir_kredit)}</td>
                                    <td className="px-2 py-1 text-right font-mono font-bold text-gray-900">{fmt(row.akhir_net)}</td>
                                </tr>
                            ))}
                            {/* Summary Row */}
                            <tr className="bg-gray-100 font-bold border-t-2 border-gray-300 text-[11px]">
                                <td colSpan="2" className="px-2 py-2 text-right text-gray-800 uppercase tracking-wider">Grand Total</td>
                                <td className="px-2 py-2 text-right font-mono text-gray-900">{fmt(totals.awal)}</td>
                                <td className="px-2 py-2 text-right font-mono text-blue-700">{fmt(totals.debet)}</td>
                                <td className="px-2 py-2 text-right font-mono text-red-700">{fmt(totals.kredit)}</td>
                                <td className="px-2 py-2 text-right font-mono text-gray-900">{fmt(totals.akhir_debet)}</td>
                                <td className="px-2 py-2 text-right font-mono text-gray-900">{fmt(totals.akhir_kredit)}</td>
                                <td className="px-2 py-2 text-right font-mono text-gray-900">{fmt(totals.akhir_net)}</td>
                            </tr>
                        </>
                    )}
                </tbody>
             </table>
        </div>
      </div>
      </div>

      {/* Detail Tabs Content */}
      {tabs.map(tab => (
          <div key={tab.id} className={`${activeTabId === tab.id ? 'flex flex-col flex-1 min-h-0 overflow-hidden' : 'hidden'}`}>
              <AccountDetailTab account={tab.account} filters={tab.filters} orgFilters={tab.orgFilters} />
          </div>
      ))}
    </div>
  );
}
