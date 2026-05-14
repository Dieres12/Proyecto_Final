const router = require('express').Router();
const { getAll, getOne, create, update, remove } = require('../controllers/parentController');
const { authenticate, requireAdmin, requireAdminOrSelf } = require('../middlewares/auth');

router.use(authenticate);
router.get('/', requireAdmin, getAll);
router.get('/:id', requireAdminOrSelf, getOne);
router.post('/', requireAdmin, create);
router.put('/:id', requireAdmin, update);
router.delete('/:id', requireAdmin, remove);
module.exports = router;
