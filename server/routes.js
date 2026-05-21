const express = require('express');
const router = express.Router();
const ledgerController = require('./controllers/ledgerController');
const authController = require('./controllers/authController');
const journalController = require('./controllers/journalController');

// Auth routes
router.post('/login', authController.login);

// Report routes
router.get('/journal/entries', journalController.getJournalEntries);

// Middleware to protect subsequent routes
router.use(authController.verifyToken);

// Option routes
router.get('/options/pt', ledgerController.getOptionsPT);
router.get('/options/regional', ledgerController.getOptionsRegional);
router.get('/options/gudang', ledgerController.getOptionsGudang);
router.get('/options/accounts', ledgerController.getOptionsAccounts);

// Report routes
router.get('/ledger/report', ledgerController.getLedgerReport);
router.get('/ledger/export', ledgerController.exportLedger);
router.get('/trial-balance/report', ledgerController.getTrialBalance);

module.exports = router;
