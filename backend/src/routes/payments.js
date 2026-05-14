const router = require('express').Router();
const { getAll, getOne, create, updateStatus, uploadReceipt } = require('../controllers/paymentController');
const { authenticate, requireAdmin } = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');

router.use(authenticate);
router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', create);
router.patch('/:id/status', requireAdmin, updateStatus);
router.post('/:id/receipt', upload.single('receipt'), uploadReceipt);
module.exports = router;
