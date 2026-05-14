// src/controllers/busController.js
const prisma = require('../config/prisma');

const getAll = async (req, res, next) => {
  try {
    const buses = await prisma.bus.findMany({
      include: {
        driver: { select: { firstName: true, lastName: true, phone: true } },
        routes: { select: { id: true, name: true, _count: { select: { students: true } } } }
      },
      orderBy: { plate: 'asc' }
    });
    res.json(buses);
  } catch (error) { next(error); }
};

const getOne = async (req, res, next) => {
  try {
    const bus = await prisma.bus.findUnique({
      where: { id: req.params.id },
      include: {
        driver: true,
        routes: { include: { stops: { orderBy: { order: 'asc' } } } },
        gpsLocations: { orderBy: { timestamp: 'desc' }, take: 50 }
      }
    });
    if (!bus) return res.status(404).json({ error: 'Bus not found' });
    res.json(bus);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const { driverId, plate, model, capacity } = req.body;
    if (!plate) return res.status(400).json({ error: 'Plate is required' });
    const bus = await prisma.bus.create({
      data: { driverId, plate, model, capacity: capacity || 30 },
      include: { driver: { select: { firstName: true, lastName: true } } }
    });
    res.status(201).json(bus);
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'Plate already exists' });
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { driverId, plate, model, capacity, active } = req.body;
    const bus = await prisma.bus.update({
      where: { id: req.params.id },
      data: { driverId, plate, model, capacity, active },
      include: { driver: { select: { firstName: true, lastName: true } } }
    });
    res.json(bus);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Bus not found' });
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await prisma.bus.update({ where: { id: req.params.id }, data: { active: false } });
    res.json({ message: 'Bus deactivated' });
  } catch (error) { next(error); }
};

module.exports = { getAll, getOne, create, update, remove };
