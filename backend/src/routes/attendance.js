const router = require('express').Router();
const { getAll, create, getStats } = require('../controllers/attendanceController');
const { authenticate, requireAdmin } = require('../middlewares/auth');

router.use(authenticate);
router.get('/stats', requireAdmin, getStats);
router.get('/', getAll);
router.post('/', create);
module.exports = router;
