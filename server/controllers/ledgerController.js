const { Op } = require('sequelize');
const db = require('../models');
const sequelize = require('../config/sequelize');

// Helper to format date
const formatDate = (date) => {
    return date ? new Date(date).toISOString().split('T')[0] : '';
};

exports.getOptionsPT = async (req, res) => {
    try {
        const rows = await db.Organisasi.findAll({
            attributes: ['kodeorganisasi', 'namaorganisasi'],
            where: { tipe: 'PT' },
            order: [['namaorganisasi', 'ASC']]
        });
        res.json(rows.map(r => ({ value: r.kodeorganisasi, label: r.namaorganisasi })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getOptionsRegional = async (req, res) => {
    try {
        const rows = await db.Regional.findAll({
            attributes: ['regional', 'nama'],
            order: [['nama', 'ASC']]
        });
        res.json(rows.map(r => ({ value: r.regional, label: r.regional })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getOptionsGudang = async (req, res) => {
    try {
        const { regional, pt } = req.query;
        // LENGTH(kodeorganisasi) = 4
        const where = sequelize.where(sequelize.fn('LENGTH', sequelize.col('kodeorganisasi')), 4);
        
        const finalWhere = { [Op.and]: [where] };
        const include = [];
        
        // Filter logic:
        // 1. Filter by PT (induk) if provided
        if (pt) {
            finalWhere[Op.and].push({ induk: pt });
        }
        
        // 2. Filter by Regional if provided (Using JOIN)
        if (regional) {
            include.push({
                model: db.RegionalAssignment,
                where: { regional },
                required: true, // Inner Join to filter
                attributes: [] // We don't need columns from the join table
            });
        }

        const rows = await db.Organisasi.findAll({
            attributes: ['kodeorganisasi', 'namaorganisasi'],
            where: finalWhere,
            include: include,
            order: [['namaorganisasi', 'ASC']],
            logging: console.log
        });
        res.json(rows.map(r => ({ value: r.kodeorganisasi, label: r.namaorganisasi })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getOptionsAccounts = async (req, res) => {
    try {
        const level = req.query.level || 5;
        const rows = await db.Account.findAll({
            attributes: ['noakun', 'namaakun'],
            where: { level },
            order: [['noakun', 'ASC']]
        });
        res.json(rows.map(r => ({ value: r.noakun, label: `${r.noakun} - ${r.namaakun}` })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getLedgerReport = async (req, res) => {
    try {
        const { pt, regional, gudang, tgl1, tgl2, akundari, akunsampai } = req.query;

        if (!tgl1 || !tgl2) {
            return res.status(400).json({ error: "Begin date and end date are required (DD-MM-YYYY)" });
        }

        // Convert DD-MM-YYYY to YYYY-MM-DD
        const parseDate = (d) => {
            const [day, month, year] = d.split('-');
            return `${year}-${month}-${day}`;
        };
        const d1 = parseDate(tgl1);
        const d2 = parseDate(tgl2);

        // 1. Resolve Org Filters
        let orgCodes = [];
        if (gudang) {
            orgCodes = [gudang];
        } else if (regional) {
            const rows = await db.Organisasi.findAll({
                attributes: ['kodeorganisasi'],
                where: { regional }
            });
            orgCodes = rows.map(r => r.kodeorganisasi);
        } else if (pt) {
            const rows = await db.Organisasi.findAll({
                attributes: ['kodeorganisasi'],
                where: { induk: pt }
            });
            orgCodes = rows.map(r => r.kodeorganisasi);
        }

        // 2. Build Base Where Clauses
        const whereClause = {
            tanggal: { [Op.between]: [d1, d2] }
        };
        
        if (orgCodes.length > 0) {
            whereClause.kodeorg = { [Op.in]: orgCodes };
        }
        
        if (akundari && akunsampai) {
            whereClause.noakun = { [Op.between]: [akundari, akunsampai] };
        } else if (akundari) {
            whereClause.noakun = { [Op.gte]: akundari };
        } else if (akunsampai) {
            whereClause.noakun = { [Op.lte]: akunsampai };
        }

        // 3. Main Query
        const rows = await db.JournalDetail.findAll({
            where: whereClause,
            include: [
                { model: db.Supplier, attributes: ['namasupplier'], required: false },
                { model: db.Account, attributes: ['namaakun'], required: false },
                { model: db.Karyawan, attributes: ['namakaryawan'], required: false }
            ],
            order: [
                ['noakun', 'ASC'],
                ['tanggal', 'ASC']
            ],
            logging: console.log
        });

        // 4. Calculate Opening Balance (Saldo Awal)
        const period = d1.substring(0, 4) + d1.substring(5, 7); // YYYYMM
        const startOfMonth = `${d1.substring(0, 7)}-01`;
        
        // 4a. Get Base Opening Balance from View
        const viewWhere = { periode: period };
        
        if (orgCodes.length > 0) {
            viewWhere.kodeorg = { [Op.in]: orgCodes };
        }
        
        if (akundari && akunsampai) {
            viewWhere.noakun = { [Op.between]: [akundari, akunsampai] };
        } else if (akundari) {
            viewWhere.noakun = { [Op.gte]: akundari };
        } else if (akunsampai) {
            viewWhere.noakun = { [Op.lte]: akunsampai };
        }

        const viewRows = await db.SaldoBulanan.findAll({
            attributes: ['noakun', [sequelize.fn('SUM', sequelize.col('awal')), 'awal']],
            where: viewWhere,
            group: ['noakun']
        });

        const saldoAwalMap = {};
        viewRows.forEach(r => {
            saldoAwalMap[r.noakun] = Number(r.dataValues.awal || 0);
        });

        // 4b. Add Interim Transactions
        if (d1 > startOfMonth) {
            const interimWhere = {
                tanggal: { [Op.gte]: startOfMonth, [Op.lt]: d1 }
            };
            
            if (orgCodes.length > 0) {
                interimWhere.kodeorg = { [Op.in]: orgCodes };
            }
            
            if (akundari && akunsampai) {
                interimWhere.noakun = { [Op.between]: [akundari, akunsampai] };
            } else if (akundari) {
                interimWhere.noakun = { [Op.gte]: akundari };
            } else if (akunsampai) {
                interimWhere.noakun = { [Op.lte]: akunsampai };
            }

            const interimRows = await db.JournalDetail.findAll({
                attributes: ['noakun', [sequelize.fn('SUM', sequelize.col('jumlah')), 'interim']],
                where: interimWhere,
                group: ['noakun']
            });

            interimRows.forEach(r => {
                if (!saldoAwalMap[r.noakun]) saldoAwalMap[r.noakun] = 0;
                saldoAwalMap[r.noakun] += Number(r.dataValues.interim || 0);
            });
        }

        // 5. Calculate Mutations
        const mutasiMap = {};
        rows.forEach(r => {
            if (!mutasiMap[r.noakun]) mutasiMap[r.noakun] = 0;
            mutasiMap[r.noakun] += Number(r.jumlah || 0);
        });

        // 6. Format Response
        const responseRows = [];
        const runningByAkun = {};
        
        rows.forEach((r, idx) => {
            const amt = Number(r.jumlah || 0);
            const debet = amt >= 0 ? amt : 0;
            const kredit = amt < 0 ? Math.abs(amt) : 0;
            
            if (runningByAkun[r.noakun] === undefined) {
                runningByAkun[r.noakun] = saldoAwalMap[r.noakun] || 0;
            }
            runningByAkun[r.noakun] += amt;
            
            responseRows.push({
                nourut: idx + 1,
                nojurnal: r.nojurnal,
                tanggal: formatDate(r.tanggal),
                noakun: r.noakun,
                namaakun: r.Account ? r.Account.namaakun : '',
                noaruskas: r.noaruskas,
                namakaryawan: r.Karyawan ? r.Karyawan.namakaryawan : '',
                kodecustomer: r.kodecustomer,
                namasupplier: r.Supplier ? r.Supplier.namasupplier : '',
                noreferensi: r.noreferensi,
                nodok: r.nodok,
                nodo: r.noreferensi,
                nocekgiro: null,
                keterangan: r.keterangan,
                debet: debet,
                kredit: kredit,
                saldo: runningByAkun[r.noakun],
                kodeorg: r.kodeorg,
                kodeblok: r.kodeblok,
                tahuntanam: r.tahuntanam
            });
        });

        // 7. Balance Summary
        const balances = [];
        const allAccounts = new Set([...Object.keys(saldoAwalMap), ...Object.keys(mutasiMap)]);
        
        // Fetch missing account names if needed
        let accountNameMap = {};
        if (allAccounts.size > 0) {
            const accRows = await db.Account.findAll({
                attributes: ['noakun', 'namaakun'],
                where: { noakun: { [Op.in]: [...allAccounts] } }
            });
            accRows.forEach(r => accountNameMap[r.noakun] = r.namaakun);
        }

        [...allAccounts].sort().forEach(acc => {
            const awal = saldoAwalMap[acc] || 0;
            const mutasi = mutasiMap[acc] || 0;
            balances.push({
                noakun: acc,
                namaakun: accountNameMap[acc] || '',
                saldo_awal: awal,
                saldo_akhir: awal + mutasi
            });
        });

        res.json({
            rows: responseRows,
            balances: balances
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.getTrialBalance = async (req, res) => {
    try {
        let { pt, regional, gudang, periodFrom, periodTo, tgl1, tgl2, revisi, akundari, akunsampai } = req.query;

        let d1, d2, periodKey;

        // Determine Date Range
        if (tgl1 && tgl2) {
             // Expecting DD-MM-YYYY
             const parseDate = (d) => {
                const [day, month, year] = d.split('-');
                return `${year}-${month}-${day}`;
            };
            d1 = parseDate(tgl1);
            d2 = parseDate(tgl2);
            periodKey = `${d1.substring(0, 4)}${d1.substring(5, 7)}`; // YYYYMM
        } else if (periodFrom && periodTo) {
            // 0. Swap periods if needed
            if (periodTo < periodFrom) {
                [periodFrom, periodTo] = [periodTo, periodFrom];
            }
            d1 = `${periodFrom}-01`;
            const [yearTo, monthTo] = periodTo.split('-');
            const lastDay = new Date(yearTo, monthTo, 0).getDate();
            d2 = `${periodTo}-${lastDay}`;
            periodKey = periodFrom.replace('-', ''); // YYYYMM
        } else {
            return res.status(400).json({ error: "Date range (tgl1, tgl2) or Period range (periodFrom, periodTo) required" });
        }

        const startOfMonth = `${d1.substring(0, 7)}-01`;

        // 1. Get CLM Account (Current Year Earnings)
        const clmRow = await db.ParameterJurnal.findOne({
            where: { kodeaplikasi: 'CLM' },
            attributes: ['noakundebet']
        });
        const clmAccount = clmRow ? clmRow.noakundebet : '';

        // 2. Resolve Org Codes (PHP Logic Replicated)
        let orgCodes = [];
        if (gudang) {
            orgCodes = [gudang];
        } else {
            // Get all PT units with length=4
            const ptUnits = await db.Organisasi.findAll({
                attributes: ['kodeorganisasi'],
                where: { 
                    induk: pt,
                    [Op.and]: [sequelize.where(sequelize.fn('LENGTH', sequelize.col('kodeorganisasi')), 4)]
                }
            });
            let ptUnitCodes = ptUnits.map(r => r.kodeorganisasi);

            if (regional) {
                // Filter by Regional Assignment
                // PHP: select kodeunit from bgt_regional_assignment where regional=X and kodeunit in (ptUnits)
                const regUnits = await db.RegionalAssignment.findAll({
                    attributes: ['kodeunit'],
                    where: { 
                        regional,
                        kodeunit: { [Op.in]: ptUnitCodes }
                    }
                });
                orgCodes = regUnits.map(r => r.kodeunit);
            } else {
                orgCodes = ptUnitCodes;
            }
        }

        const orgFilter = orgCodes.length > 0 ? { kodeorg: { [Op.in]: orgCodes } } : {};

        // 3. Account Filter
        const accountFilter = {};
        const noakunWhere = {};
        
        if (clmAccount) {
            noakunWhere[Op.ne] = clmAccount;
        }
        
        if (akundari && akunsampai) {
            noakunWhere[Op.between] = [akundari, akunsampai];
        } else if (akundari) {
             noakunWhere[Op.gte] = akundari;
        } else if (akunsampai) {
             noakunWhere[Op.lte] = akunsampai;
        }

        if (Object.getOwnPropertySymbols(noakunWhere).length > 0) {
            accountFilter.noakun = noakunWhere;
        }

        // 4. Adjust Saldo Awal
        // PHP: select sum(nilai) ... from adjust_saldo_awal where periode <= $periode ...
        // Note: AdjustSaldoAwal is usually period based. We use the periodKey (YYYY-MM) derived from d1.
        const adjustPeriod = periodKey.substring(0, 4) + '-' + periodKey.substring(4, 6);
        const adjustRows = await db.AdjustSaldoAwal.findAll({
            attributes: ['noakun', [sequelize.fn('SUM', sequelize.col('nilai')), 'total_adjust']],
            where: {
                periode: { [Op.lte]: adjustPeriod },
                ...orgFilter,
                ...accountFilter
            },
            group: ['noakun']
        });
        const adjustMap = {};
        adjustRows.forEach(r => adjustMap[r.noakun] = Number(r.dataValues.total_adjust || 0));

        // 5. Saldo Bulanan (Opening Balance View)
        // PHP: sum(awalXX) from keu_saldobulanan where periode = YYYYMM
        const saldoRows = await db.SaldoBulanan.findAll({
             attributes: ['noakun', [sequelize.fn('SUM', sequelize.col('awal')), 'total_awal']],
             where: {
                 periode: periodKey,
                 ...orgFilter,
                 ...accountFilter
             },
             group: ['noakun']
        });
        const saldoMap = {};
        saldoRows.forEach(r => saldoMap[r.noakun] = Number(r.dataValues.total_awal || 0));

        // 5b. Add Interim Transactions (if d1 > startOfMonth)
        if (d1 > startOfMonth) {
            const interimWhere = {
                tanggal: { [Op.gte]: startOfMonth, [Op.lt]: d1 },
                ...orgFilter,
                ...accountFilter
            };
             if (revisi !== undefined && revisi !== '') {
                interimWhere.revisi = { [Op.lte]: revisi };
            }

            const interimRows = await db.JournalDetail.findAll({
                attributes: ['noakun', [sequelize.fn('SUM', sequelize.col('jumlah')), 'interim']],
                where: interimWhere,
                group: ['noakun']
            });

            interimRows.forEach(r => {
                if (!saldoMap[r.noakun]) saldoMap[r.noakun] = 0;
                saldoMap[r.noakun] += Number(r.dataValues.interim || 0);
            });
        }

        // 6. Mutations (Transactions)
        // PHP: from keu_jurnaldt_vw where periode >= $periode and periode <= $periode1 and revisi <= $revisi
        // We use JournalDetail (table) with tanggal range which is equivalent to period range
        const journalWhere = {
            tanggal: { [Op.between]: [d1, d2] },
            ...orgFilter,
            ...accountFilter
        };

        if (revisi !== undefined && revisi !== '') {
            journalWhere.revisi = { [Op.lte]: revisi };
        }

        const journalRows = await db.JournalDetail.findAll({
            attributes: [
                'noakun',
                [sequelize.literal('SUM(CASE WHEN jumlah >= 0 THEN jumlah ELSE 0 END)'), 'total_debet'],
                [sequelize.literal('SUM(CASE WHEN jumlah < 0 THEN ABS(jumlah) ELSE 0 END)'), 'total_kredit']
            ],
            where: journalWhere,
            group: ['noakun']
        });

        const journalMap = {};
        journalRows.forEach(r => {
            journalMap[r.noakun] = {
                debet: Number(r.dataValues.total_debet || 0),
                kredit: Number(r.dataValues.total_kredit || 0)
            };
        });

        // 7. Combine and Fetch Account Names
        const allAccounts = new Set([
            ...Object.keys(adjustMap),
            ...Object.keys(saldoMap),
            ...Object.keys(journalMap)
        ]);
        
        let accountNameMap = {};
        if (allAccounts.size > 0) {
            const accRows = await db.Account.findAll({
                attributes: ['noakun', 'namaakun'],
                where: { noakun: { [Op.in]: [...allAccounts] } }
            });
            accRows.forEach(r => accountNameMap[r.noakun] = r.namaakun);
        }

        const result = [];
        [...allAccounts].sort().forEach(acc => {
            const adj = adjustMap[acc] || 0;
            const sal = saldoMap[acc] || 0;
            const sawal = sal + adj;
            
            const j = journalMap[acc] || { debet: 0, kredit: 0 };
            const salak = sawal + j.debet - j.kredit;

            // Skip if no activity and no balance
            if (sawal === 0 && j.debet === 0 && j.kredit === 0 && salak === 0) return;

            result.push({
                noakun: acc,
                namaakun: accountNameMap[acc] || acc,
                awal: sawal,
                debet: j.debet,
                kredit: j.kredit,
                akhir_debet: salak > 0 ? salak : 0,
                akhir_kredit: salak < 0 ? Math.abs(salak) : 0,
                akhir_net: salak
            });
        });

        res.json(result);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
