// src/controllers/parentController.js - Parents CRUD
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

/**
 * GET /api/parents - List all parents (Admin)
 */
const getAll = async (req, res, next) => {
  try {
    const parents = await prisma.parent.findMany({
      include: {
        user: { select: { email: true, active: true, role: true } },
        students: { where: { active: true }, select: { id: true, firstName: true, lastName: true } },
        _count: { select: { students: true, payments: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(parents);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/parents/:id - Get single parent
 */
const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parent = await prisma.parent.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, active: true } },
        students: { where: { active: true } },
        payments: { orderBy: { createdAt: 'desc' }, take: 10, include: { receipt: true } }
      }
    });

    if (!parent) return res.status(404).json({ error: 'Parent not found' });
    res.json(parent);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/parents - Create parent with user account
 */
const create = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone, address } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Email, password, firstName and lastName are required' });
    }

    // Check if email exists
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          role: 'PADRE'
        }
      });

      const parent = await tx.parent.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          phone,
          address
        },
        include: {
          user: { select: { email: true, role: true } }
        }
      });

      return parent;
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/parents/:id - Update parent
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, address } = req.body;

    const parent = await prisma.parent.update({
      where: { id },
      data: { firstName, lastName, phone, address },
      include: { user: { select: { email: true } } }
    });

    res.json(parent);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Parent not found' });
    next(error);
  }
};

/**
 * DELETE /api/parents/:id - Soft delete parent
 */
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parent = await prisma.parent.findUnique({ where: { id } });
    if (!parent) return res.status(404).json({ error: 'Parent not found' });

    await prisma.user.update({
      where: { id: parent.userId },
      data: { active: false }
    });

    res.json({ message: 'Parent deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getOne, create, update, remove };
