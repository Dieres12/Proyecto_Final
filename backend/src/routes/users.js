const router = require('express').Router();
const prisma = require('../config/prisma');
const { authenticate, requireAdmin } = require('../middlewares/auth');

router.use(authenticate, requireAdmin);
router.get('/', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, active: true, createdAt: true }
    });
    res.json(users);
  } catch (e) { next(e); }
});
module.exports = router;
