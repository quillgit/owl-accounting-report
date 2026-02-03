const { Op } = require('sequelize');
const JournalDetail = require('../models/JournalDetail');
const Account = require('../models/Account');
const Supplier = require('../models/Supplier');
const Karyawan = require('../models/Karyawan');

exports.getJournalEntries = async (req, res) => {
    console.log('getJournalEntries called with query:', req.query);
    try {
        const { 
            page = 1, 
            limit = 50, 
            search = '',
            sortBy = 'tanggal',
            sortOrder = 'DESC',
            tgl1,
            tgl2
        } = req.query;

        const offset = (page - 1) * limit;

        const whereClause = {};

        if (tgl1 && tgl2) {
            const parseDate = (d) => {
                const [day, month, year] = d.split('-');
                return `${year}-${month}-${day}`;
            };
            const d1 = parseDate(tgl1);
            const d2 = parseDate(tgl2);
            whereClause.tanggal = { [Op.between]: [d1, d2] };
        }

        if (search) {
            whereClause[Op.or] = [
                { nojurnal: { [Op.like]: `%${search}%` } },
                { noakun: { [Op.like]: `%${search}%` } },
                { keterangan: { [Op.like]: `%${search}%` } },
                { noreferensi: { [Op.like]: `%${search}%` } },
                { nodok: { [Op.like]: `%${search}%` } },
                { kodeorg: { [Op.like]: `%${search}%` } },
                { kodeblok: { [Op.like]: `%${search}%` } },
                { nik: { [Op.like]: `%${search}%` } },
                { kodecustomer: { [Op.like]: `%${search}%` } },
                { kodesupplier: { [Op.like]: `%${search}%` } },
                { noaruskas: { [Op.like]: `%${search}%` } },
                { '$Account.namaakun$': { [Op.like]: `%${search}%` } },
                { '$Supplier.namasupplier$': { [Op.like]: `%${search}%` } },
                { '$Karyawan.namakaryawan$': { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows } = await JournalDetail.findAndCountAll({
            where: whereClause,
            include: [
                { 
                    model: Account, 
                    attributes: ['namaakun'] 
                },
                { 
                    model: Supplier, 
                    attributes: ['namasupplier'] 
                },
                {
                    model: Karyawan,
                    attributes: ['namakaryawan'],
                    required: false
                }
            ],
            order: [[sortBy, sortOrder]],
            limit: parseInt(limit),
            offset: parseInt(offset),
            subQuery: false
        });

        res.json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            rows: rows
        });

    } catch (error) {
        console.error('Error fetching journal entries:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};
