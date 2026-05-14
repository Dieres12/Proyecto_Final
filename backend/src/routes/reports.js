const router = require('express').Router();
const { getDashboardStats, getPaymentReport, getStudentsByRoute } = require('../controllers/reportController');
const { authenticate, requireAdmin } = require('../middlewares/auth');

router.use(authenticate, requireAdmin);
router.get('/dashboard', getDashboardStats);
router.get('/payments', getPaymentReport);
router.get('/students-by-route', getStudentsByRoute);
module.exports = router;
