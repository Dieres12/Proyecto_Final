// src/controllers/studentController.js - Students CRUD
const prisma = require('../config/prisma');

const getAll = async (req, res, next) => {
  try {
    const { routeId, parentId, active } = req.query;
    const where = {};
    if (routeId) where.routeId = routeId;
    if (parentId) where.parentId = parentId;
    if (active !== undefined) where.active = active === 'true';

    // If PADRE role, only show their own students
    if (req.user.role === 'PADRE') {
      const parent = await prisma.parent.findUnique({ where: { userId: req.user.id } });
      if (parent) where.parentId = parent.id;
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        parent: { select: { firstName: true, lastName: true, phone: true } },
        route: { select: { id: true, name: true } },
        _count: { select: { attendances: true } }
      },
      orderBy: { firstName: 'asc' }
    });
    res.json(students);
  } catch (error) {
    next(error);
  }
};

const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        parent: { include: { user: { select: { email: true } } } },
        route: { include: { stops: { orderBy: { order: 'asc' } }, bus: true } },
        attendances: { orderBy: { date: 'desc' }, take: 30 }
      }
    });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { parentId, routeId, firstName, lastName, grade, section, birthDate } = req.body;

    if (!parentId || !firstName || !lastName || !grade) {
      return res.status(400).json({ error: 'parentId, firstName, lastName and grade are required' });
    }

    const student = await prisma.student.create({
      data: { parentId, routeId, firstName, lastName, grade, section, birthDate: birthDate ? new Date(birthDate) : null },
      include: { parent: { select: { firstName: true, lastName: true } }, route: { select: { name: true } } }
    });
    res.status(201).json(student);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { routeId, firstName, lastName, grade, section, birthDate, active } = req.body;

    const student = await prisma.student.update({
      where: { id },
      data: { routeId, firstName, lastName, grade, section, birthDate: birthDate ? new Date(birthDate) : undefined, active },
      include: { parent: { select: { firstName: true, lastName: true } }, route: { select: { name: true } } }
    });
    res.json(student);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Student not found' });
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.student.update({ where: { id }, data: { active: false } });
    res.json({ message: 'Student deactivated' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Student not found' });
    next(error);
  }
};

module.exports = { getAll, getOne, create, update, remove };
