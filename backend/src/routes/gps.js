const router = require('express').Router();
const { getCurrentLocations, getHistory, getBusHistory } = require('../controllers/gpsController');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);
router.get('/current', getCurrentLocations);
router.get('/history', getHistory);
router.get('/bus/:id', getBusHistory);
module.exports = router;
