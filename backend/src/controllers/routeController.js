// src/controllers/routeController.js
const prisma = require('../config/prisma');

const getAll = async (req, res, next) => {
  try {
    const routes = await prisma.route.findMany({
      include: {
        bus: { select: { id: true, plate: true, model: true, driver: { select: { firstName: true, lastName: true } } } },
        stops: { orderBy: { order: 'asc' } },
        _count: { select: { students: true } }
      },
      orderBy: { name: 'asc' }
    });
    res.json(routes);
  } catch (error) { next(error); }
};

const getOne = async (req, res, next) => {
  try {
    const route = await prisma.route.findUnique({
      where: { id: req.params.id },
      include: {
        bus: { include: { driver: true } },
        stops: { orderBy: { order: 'asc' } },
        students: { where: { active: true }, include: { parent: { select: { firstName: true, lastName: true, phone: true } } } }
      }
    });
    if (!route) return res.status(404).json({ error: 'Route not found' });
    res.json(route);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const { busId, name, description, stops } = req.body;
    if (!name) return res.status(400).json({ error: 'Route name is required' });

    const route = await prisma.route.create({
      data: {
        busId,
        name,
        description,
        stops: stops?.length ? {
          create: stops.map((stop, idx) => ({
            name: stop.name,
            lat: stop.lat,
            lng: stop.lng,
            order: stop.order || idx + 1
          }))
        } : undefined
      },
      include: { stops: { orderBy: { order: 'asc' } }, bus: true }
    });
    res.status(201).json(route);
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const { busId, name, description, active } = req.body;
    const route = await prisma.route.update({
      where: { id: req.params.id },
      data: { busId, name, description, active },
      include: { bus: true, stops: { orderBy: { order: 'asc' } } }
    });
    res.json(route);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Route not found' });
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await prisma.route.update({ where: { id: req.params.id }, data: { active: false } });
    res.json({ message: 'Route deactivated' });
  } catch (error) { next(error); }
};

// Manage stops
const addStop = async (req, res, next) => {
  try {
    const { name, lat, lng, order } = req.body;
    const stop = await prisma.stop.create({
      data: { routeId: req.params.id, name, lat, lng, order }
    });
    res.status(201).json(stop);
  } catch (error) { next(error); }
};

const removeStop = async (req, res, next) => {
  try {
    await prisma.stop.delete({ where: { id: req.params.stopId } });
    res.json({ message: 'Stop removed' });
  } catch (error) { next(error); }
};

module.exports = { getAll, getOne, create, update, remove, addStop, removeStop };
