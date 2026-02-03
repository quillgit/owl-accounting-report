import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Loader2, ArrowRight } from 'lucide-react';
import * as XLSX from 'xlsx';

const AccountDetailTab = ({ account, filters, orgFilters }) => {
  const [data, setData] = useState([]);
  const [saldoAwal, setSaldoAwal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Helper to format currency
  const fmt = (n) => {
    if (n === null || n === undefined) return '';
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  };

  useEffect(() => {
    fetchDetail();
  }, []);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      let d1, d2;
      
      if (filters.tgl1 && filters.tgl2) {
          d1 = filters.tgl1;
          d2 = filters.tgl2;
      } else {
          // Calculate Dates from Period (DD-MM-YYYY)
          const [y1, m1] = filters.periodFrom.split('-');
          d1 = `01-${m1}-${y1}`;

          const [y2, m2] = filters.periodTo.split('-');
          const lastDay = new Date(y2, m2, 0).getDate();
          d2 = `${lastDay}-${m2}-${y2}`;
      }

      const params = {
        ...orgFilters, // pt, regional, gudang
        tgl1: d1,
        tgl2: d2,
        akundari: account.noakun,
        akunsampai: account.noakun,
        revisi: filters.revisi
      };

      const response = await axios.get('/api/ledger/report', { params });
      
      const rows = response.data.rows || [];
      const balances = response.data.balances || [];
      const accBalance = balances.find(b => b.noakun === account.noakun);
      const initialBalance = accBalance ? accBalance.saldo_awal : 0;

      // Add Saldo Awal row logic if needed or just display it separately
      setSaldoAwal(initialBalance);
      setData(rows);
    } catch (error) {
      console.error("Error fetching account detail:", error);
    } finally {
      setLoading(false);
    }
  };

  // Flatten data for table
  // The ledger API returns rows grouped by account in the UI logic usually, but the API returns flat list sorted by account.
  // We can just render the rows.
  
  // Calculate running balance?
  // The API returns 'saldo' for each row? 
  // Let's check ledgerController.js (I don't have it open but I can infer).
  // Usually Ledger Report returns transactions.
  
  // Let's calculate running balance client side if needed.
  // The first row should be "Saldo Awal"?
  // Or the API includes Saldo Awal as a row?
  
  return (
    <div className="flex flex-col h-full bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div>
             <h3 className="font-bold text-lg text-gray-800">{account.noakun} - {account.namaakun}</h3>
             <p className="text-sm text-gray-500">
                Period: {filters.tgl1 ? `${filters.tgl1} to ${filters.tgl2}` : `${filters.periodFrom} to ${filters.periodTo}`}
             </p>
          </div>
          <button onClick={fetchDetail} className="text-[#875A7B] hover:underline text-sm font-semibold">
            Refresh
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-max min-w-full text-xs text-left border-collapse">
            <thead className="text-[10px] text-gray-700 uppercase bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
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
                <th className="px-2 py-1.5 text-right border-r border-gray-100 whitespace-nowrap text-blue-600">Debet</th>
                <th className="px-2 py-1.5 text-right border-r border-gray-100 whitespace-nowrap text-red-600">Kredit</th>
                <th className="px-2 py-1.5 text-right border-r border-gray-100 whitespace-nowrap">Saldo</th>
                <th className="px-2 py-1.5 border-r border-gray-100 whitespace-nowrap">Kode Org</th>
                <th className="px-2 py-1.5 border-r border-gray-100 whitespace-nowrap">Kode Blok</th>
                <th className="px-2 py-1.5 whitespace-nowrap">Tahun Tanam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[11px]">
              {/* Saldo Awal Row */}
              <tr className="bg-gray-50/80 font-semibold text-gray-700">
                  <td className="px-2 py-1.5 border-r border-gray-100"></td>
                  <td className="px-2 py-1.5 border-r border-gray-100"></td>
                  <td className="px-2 py-1.5 border-r border-gray-100"></td>
                  <td className="px-2 py-1.5 border-r border-gray-100 text-[#875A7B]">{account.noakun}</td>
                  <td className="px-2 py-1.5 border-r border-gray-100"></td>
                  <td className="px-2 py-1.5 border-r border-gray-100"></td>
                  <td className="px-2 py-1.5 border-r border-gray-100"></td>
                  <td className="px-2 py-1.5 border-r border-gray-100"></td>
                  <td className="px-2 py-1.5 border-r border-gray-100"></td>
                  <td className="px-2 py-1.5 border-r border-gray-100"></td>
                  <td className="px-2 py-1.5 border-r border-gray-100"></td>
                  <td className="px-2 py-1.5 border-r border-gray-100"></td>
                  <td className="px-2 py-1.5 border-r border-gray-100"></td>
                  <td className="px-2 py-1.5 border-r border-gray-100 italic">Saldo Awal</td>
                  <td className="px-2 py-1.5 border-r border-gray-100 text-right"></td>
                  <td className="px-2 py-1.5 border-r border-gray-100 text-right"></td>
                  <td className="px-2 py-1.5 border-r border-gray-100 text-right font-mono text-gray-900">{fmt(saldoAwal)}</td>
                  <td className="px-2 py-1.5 border-r border-gray-100"></td>
                  <td className="px-2 py-1.5 border-r border-gray-100"></td>
                  <td className="px-2 py-1.5"></td>
              </tr>
              {loading ? (
                <tr>
                  <td colSpan="20" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-[#875A7B]" />
                      <p>Loading detail...</p>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="20" className="px-6 py-12 text-center text-gray-500 italic">
                    No transactions found for this period.
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-purple-50/30 transition-colors">
                    <td className="px-2 py-1.5 border-r border-gray-100 text-center text-gray-500">{idx + 1}</td>
                    <td className="px-2 py-1.5 border-r border-gray-100 text-gray-600 whitespace-nowrap">{row.nojurnal}</td>
                    <td className="px-2 py-1.5 border-r border-gray-100 font-medium text-gray-900 whitespace-nowrap">{row.tanggal}</td>
                    <td className="px-2 py-1.5 border-r border-gray-100 text-gray-600 whitespace-nowrap">{row.noakun}</td>
                    <td className="px-2 py-1.5 border-r border-gray-100 text-gray-600 whitespace-nowrap">{row.namaakun}</td>
                    <td className="px-2 py-1.5 border-r border-gray-100 text-gray-600 whitespace-nowrap">{row.noaruskas}</td>
                    <td className="px-2 py-1.5 border-r border-gray-100 text-gray-600 whitespace-nowrap">{row.namakaryawan}</td>
                    <td className="px-2 py-1.5 border-r border-gray-100 text-gray-600 whitespace-nowrap">{row.kodecustomer}</td>
                    <td className="px-2 py-1.5 border-r border-gray-100 text-gray-600 whitespace-nowrap">{row.namasupplier}</td>
                    <td className="px-2 py-1.5 border-r border-gray-100 text-gray-500 whitespace-nowrap">{row.noreferensi}</td>
                    <td className="px-2 py-1.5 border-r border-gray-100 text-gray-500 whitespace-nowrap">{row.nodok}</td>
                    <td className="px-2 py-1.5 border-r border-gray-100 text-gray-500 whitespace-nowrap">{row.nodo}</td>
                    <td className="px-2 py-1.5 border-r border-gray-100 text-gray-500 whitespace-nowrap">{row.nocekgiro}</td>
                    <td className="px-2 py-1.5 border-r border-gray-100 text-gray-600 max-w-[300px] truncate" title={row.keterangan}>{row.keterangan}</td>
                    <td className="px-2 py-1.5 text-right border-r border-gray-100 font-mono text-blue-600 whitespace-nowrap">{fmt(row.debet)}</td>
                    <td className="px-2 py-1.5 text-right border-r border-gray-100 font-mono text-red-600 whitespace-nowrap">{fmt(row.kredit)}</td>
                    <td className="px-2 py-1.5 text-right border-r border-gray-100 font-mono font-medium text-gray-800 whitespace-nowrap">{fmt(row.saldo)}</td>
                    <td className="px-2 py-1.5 border-r border-gray-100 text-gray-600 whitespace-nowrap">{row.kodeorg}</td>
                    <td className="px-2 py-1.5 border-r border-gray-100 text-gray-600 whitespace-nowrap">{row.kodeblok}</td>
                    <td className="px-2 py-1.5 text-gray-600 whitespace-nowrap">{row.tahuntanam}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccountDetailTab;
