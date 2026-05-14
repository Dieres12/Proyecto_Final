// src/controllers/gpsController.js
const prisma = require('../config/prisma');

const getCurrentLocations = async (req, res, next) => {
  try {
    const buses = await prisma.bus.findMany({
      where: { active: true, currentLat: { not: null } },
      select: {
        id: true, plate: true, model: true,
        currentLat: true, currentLng: true, lastLocation: true,
        driver: { select: { firstName: true, lastName: true } },
        routes: { select: { id: true, name: true } }
      }
    });
    res.json(buses);
  } catch (error) { next(error); }
};

const getHistory = async (req, res, next) => {
  try {
    const { busId, from, to, limit } = req.query;
    const where = {};
    if (busId) where.busId = busId;
    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp.gte = new Date(from);
      if (to) where.timestamp.lte = new Date(to);
    }

    const locations = await prisma.gPSLocation.findMany({
      where,
      include: { bus: { select: { plate: true, model: true } } },
      orderBy: { timestamp: 'desc' },
      take: limit ? parseInt(limit) : 100
    });
    res.json(locations);
  } catch (error) { next(error); }
};

const getBusHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const locations = await prisma.gPSLocation.findMany({
      where: { busId: id },
      orderBy: { timestamp: 'desc' },
      take: 200
    });
    res.json(locations);
  } catch (error) { next(error); }
};

module.exports = { getCurrentLocations, getHistory, getBusHistory };
