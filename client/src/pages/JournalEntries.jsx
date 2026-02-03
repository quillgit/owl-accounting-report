import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import OdooSearch from '../components/OdooSearch';
import DatePicker from '../components/DatePicker';

export default function JournalEntries({ onNavigate }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchState, setSearchState] = useState({ text: '', filters: [] });
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit, setLimit] = useState(50);
    const [totalItems, setTotalItems] = useState(0);
    const [dateRange, setDateRange] = useState({ tgl1: '', tgl2: '' });

    // Debounce fetch
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchEntries();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, page, limit, dateRange.tgl1, dateRange.tgl2]);

    useEffect(() => {
        const baseText = searchState.text ? searchState.text.trim() : '';
        const filterValues = (searchState.filters || []).map(f => f.value).filter(Boolean);
        const combined = [baseText, ...filterValues].join(' ').trim();
        setPage(1);
        setSearchQuery(combined);
    }, [searchState]);

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit,
                search: searchQuery
            };

            if (dateRange.tgl1 && dateRange.tgl2) {
                params.tgl1 = dateRange.tgl1;
                params.tgl2 = dateRange.tgl2;
            }

            const response = await axios.get('/api/journal/entries', { params });
            setData(response.data.rows);
            setTotalPages(response.data.totalPages);
            setTotalItems(response.data.totalItems);
        } catch (error) {
            console.error("Failed to fetch journal entries", error);
        } finally {
            setLoading(false);
        }
    };

    const fmt = (n) => new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2 }).format(n);

    return (
        <div className="h-full flex flex-col gap-4">
            {/* Header & Controls */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-3 flex-none">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-gray-800">Journal Entries</h1>
                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">
                            {loading ? '...' : `${totalItems} Records`}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <OdooSearch
                                onSearch={setSearchState}
                                placeholder="Search anything (Jurnal, Akun, Ket, Dok...)"
                                searchableFields={[
                                    { key: 'nojurnal', label: 'No Jurnal' },
                                    { key: 'noakun', label: 'No Akun' },
                                    { key: 'namaakun', label: 'Nama Akun' },
                                    { key: 'keterangan', label: 'Keterangan' },
                                    { key: 'nodok', label: 'No Dok' },
                                    { key: 'noreferensi', label: 'Ref' },
                                    { key: 'kodeorg', label: 'Org' },
                                    { key: 'noaruskas', label: 'Arus Kas' },
                                    { key: 'kodecustomer', label: 'Customer' },
                                    { key: 'namasupplier', label: 'Supplier' },
                                    { key: 'namakaryawan', label: 'Karyawan' }
                                ]}
                            />
                            {loading && (
                                <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#875A7B] animate-spin" />
                            )}
                        </div>
                        
                        <select 
                            className="rounded-lg border border-gray-300 py-2 px-3 text-sm focus:ring-2 focus:ring-[#875A7B] outline-none"
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value));
                                setPage(1);
                            }}
                        >
                            <option value="50">50 / page</option>
                            <option value="100">100 / page</option>
                            <option value="200">200 / page</option>
                            <option value="500">500 / page</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Range Tanggal (Opsional)</span>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <DatePicker
                            value={dateRange.tgl1}
                            onChange={(d) => {
                                setDateRange(prev => ({ ...prev, tgl1: d }));
                                setPage(1);
                            }}
                            placeholder="Dari (DD-MM-YYYY)"
                            className="w-full sm:w-40"
                        />
                        <span className="text-gray-400 text-xs">s/d</span>
                        <DatePicker
                            value={dateRange.tgl2}
                            onChange={(d) => {
                                setDateRange(prev => ({ ...prev, tgl2: d }));
                                setPage(1);
                            }}
                            placeholder="Sampai (DD-MM-YYYY)"
                            className="w-full sm:w-40"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-auto">
                    <table className="w-max min-w-full text-xs text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-3 py-2 border-r border-gray-100 whitespace-nowrap">No Jurnal</th>
                                <th className="px-3 py-2 border-r border-gray-100 whitespace-nowrap">Tanggal</th>
                                <th className="px-3 py-2 border-r border-gray-100 whitespace-nowrap">No Akun</th>
                                <th className="px-3 py-2 border-r border-gray-100 whitespace-nowrap">Nama Akun</th>
                                <th className="px-3 py-2 border-r border-gray-100 whitespace-nowrap">Keterangan</th>
                                <th className="px-3 py-2 text-right border-r border-gray-100 whitespace-nowrap">Jumlah</th>
                                <th className="px-3 py-2 border-r border-gray-100 whitespace-nowrap">Org</th>
                                <th className="px-3 py-2 border-r border-gray-100 whitespace-nowrap">No Dok</th>
                                <th className="px-3 py-2 border-r border-gray-100 whitespace-nowrap">Ref</th>
                                <th className="px-3 py-2 border-r border-gray-100 whitespace-nowrap">Arus Kas</th>
                                <th className="px-3 py-2 border-r border-gray-100 whitespace-nowrap">Karyawan</th>
                                <th className="px-3 py-2 border-r border-gray-100 whitespace-nowrap">Customer</th>
                                <th className="px-3 py-2 border-r border-gray-100 whitespace-nowrap">Supplier</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y divide-gray-100 ${loading ? 'opacity-50 transition-opacity duration-200' : ''}`}>
                            {loading && data.length === 0 ? (
                                <tr>
                                    <td colSpan="13" className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="w-8 h-8 animate-spin text-[#875A7B]" />
                                            <p>Loading journal entries...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan="13" className="px-6 py-12 text-center text-gray-500 italic">
                                        No records found. Try a different search.
                                    </td>
                                </tr>
                            ) : (
                                data.map((row, idx) => (
                                    <tr key={`${row.nojurnal}-${row.noakun}-${idx}`} className="hover:bg-purple-50/30 transition-colors">
                                        <td className="px-3 py-1.5 border-r border-gray-100 font-medium text-gray-800">{row.nojurnal}</td>
                                        <td className="px-3 py-1.5 border-r border-gray-100 whitespace-nowrap text-gray-600">{row.tanggal}</td>
                                        <td className="px-3 py-1.5 border-r border-gray-100 text-[#875A7B]">{row.noakun}</td>
                                        <td className="px-3 py-1.5 border-r border-gray-100 truncate max-w-[200px]" title={row.Account?.namaakun}>{row.Account?.namaakun}</td>
                                        <td className="px-3 py-1.5 border-r border-gray-100 truncate max-w-[300px]" title={row.keterangan}>{row.keterangan}</td>
                                        <td className={`px-3 py-1.5 text-right border-r border-gray-100 font-mono font-medium ${parseFloat(row.jumlah) < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                            {fmt(row.jumlah)}
                                        </td>
                                        <td className="px-3 py-1.5 border-r border-gray-100 text-gray-600">{row.kodeorg}</td>
                                        <td className="px-3 py-1.5 border-r border-gray-100 text-gray-500">{row.nodok}</td>
                                        <td className="px-3 py-1.5 border-r border-gray-100 text-gray-500">{row.noreferensi}</td>
                                        <td className="px-3 py-1.5 border-r border-gray-100 text-gray-500">{row.noaruskas}</td>
                                        <td className="px-3 py-1.5 border-r border-gray-100 text-gray-600 truncate max-w-[150px]">{row.Karyawan?.namakaryawan}</td>
                                        <td className="px-3 py-1.5 border-r border-gray-100 text-gray-500">{row.kodecustomer}</td>
                                        <td className="px-3 py-1.5 border-r border-gray-100 text-gray-600 truncate max-w-[150px]">{row.Supplier?.namasupplier}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between flex-none">
                    <div className="text-xs text-gray-500">
                        Page {page} of {totalPages} ({totalItems} items)
                    </div>
                    <div className="flex gap-1">
                        <button 
                            onClick={() => setPage(1)} 
                            disabled={page === 1 || loading}
                            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors"
                        >
                            <ChevronsLeft className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setPage(p => Math.max(1, p - 1))} 
                            disabled={page === 1 || loading}
                            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                            disabled={page === totalPages || loading}
                            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setPage(totalPages)} 
                            disabled={page === totalPages || loading}
                            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 transition-colors"
                        >
                            <ChevronsRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
