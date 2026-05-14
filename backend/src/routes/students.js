const router = require('express').Router();
const { getAll, getOne, create, update, remove } = require('../controllers/studentController');
const { authenticate, requireAdmin } = require('../middlewares/auth');

router.use(authenticate);
router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', requireAdmin, create);
router.put('/:id', requireAdmin, update);
router.delete('/:id', requireAdmin, remove);
module.exports = router;
