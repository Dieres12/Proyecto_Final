const router = require('express').Router();
const { getAll, getOne, create, update, remove, addStop, removeStop } = require('../controllers/routeController');
const { authenticate, requireAdmin } = require('../middlewares/auth');

router.use(authenticate);
router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', requireAdmin, create);
router.put('/:id', requireAdmin, update);
router.delete('/:id', requireAdmin, remove);
router.post('/:id/stops', requireAdmin, addStop);
router.delete('/:id/stops/:stopId', requireAdmin, removeStop);
module.exports = router;
