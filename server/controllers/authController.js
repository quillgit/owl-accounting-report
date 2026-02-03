const db = require('../models');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

const SECRET_KEY = process.env.JWT_SECRET || 'ledger_secret_key_123';

exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        // Find user with matching username and password hash
        // We use a raw condition for password to utilize MySQL's PASSWORD() function
        const user = await db.User.findOne({
            where: {
                namauser: username,
                // securely compare password column with PASSWORD(input)
                [Op.and]: db.sequelize.where(
                    db.sequelize.col('User.password'),
                    db.sequelize.fn('PASSWORD', password)
                )
            },
            include: [{
                model: db.Karyawan,
                required: true, // Inner join
                where: {
                    lokasitugas: { [Op.like]: '%HO%' },
                    bagian: { [Op.in]: ['GIS', 'RCT'] }
                }
            }]
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials or unauthorized access' });
        }

        // Generate JWT
        const token = jwt.sign(
            { 
                username: user.namauser, 
                karyawanid: user.karyawanid,
                namakaryawan: user.Karyawan.namakaryawan
            },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                username: user.namauser,
                namakaryawan: user.Karyawan.namakaryawan,
                bagian: user.Karyawan.bagian
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Failed to authenticate token' });
        }
        req.user = decoded;
        next();
    });
};
