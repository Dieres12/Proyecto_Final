// src/controllers/driverController.js
const prisma = require('../config/prisma');

const getAll = async (req, res, next) => {
  try {
    const drivers = await prisma.driver.findMany({
      include: { buses: { where: { active: true }, select: { id: true, plate: true, model: true } } },
      orderBy: { firstName: 'asc' }
    });
    res.json(drivers);
  } catch (error) { next(error); }
};

const getOne = async (req, res, next) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: req.params.id },
      include: { buses: { include: { routes: true } } }
    });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    res.json(driver);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const { firstName, lastName, license, phone, email } = req.body;
    if (!firstName || !lastName || !license) {
      return res.status(400).json({ error: 'firstName, lastName and license are required' });
    }
    const driver = await prisma.driver.create({ data: { firstName, lastName, license, phone, email } });
    res.status(201).json(driver);
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'License already registered' });
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { firstName, lastName, license, phone, email, active } = req.body;
    const driver = await prisma.driver.update({
      where: { id: req.params.id },
      data: { firstName, lastName, license, phone, email, active }
    });
    res.json(driver);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Driver not found' });
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await prisma.driver.update({ where: { id: req.params.id }, data: { active: false } });
    res.json({ message: 'Driver deactivated' });
  } catch (error) { next(error); }
};

module.exports = { getAll, getOne, create, update, remove };
