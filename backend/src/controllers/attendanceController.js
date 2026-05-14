// src/controllers/attendanceController.js
const prisma = require('../config/prisma');

const getAll = async (req, res, next) => {
  try {
    const { studentId, date, from, to } = req.query;
    const where = {};
    if (studentId) where.studentId = studentId;
    if (date) where.date = { gte: new Date(date), lt: new Date(new Date(date).getTime() + 86400000) };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    if (req.user.role === 'PADRE') {
      const parent = await prisma.parent.findUnique({ where: { userId: req.user.id } });
      if (parent) {
        const studentIds = (await prisma.student.findMany({ where: { parentId: parent.id }, select: { id: true } })).map(s => s.id);
        where.studentId = { in: studentIds };
      }
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        student: { select: { firstName: true, lastName: true, grade: true, parent: { select: { firstName: true, lastName: true } } } }
      },
      orderBy: { date: 'desc' }
    });
    res.json(attendance);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const { studentId, date, lat, lng, observations } = req.body;

    if (!studentId || !date) {
      return res.status(400).json({ error: 'studentId and date are required' });
    }

    // Verify parent owns this student
    if (req.user.role === 'PADRE') {
      const parent = await prisma.parent.findUnique({ where: { userId: req.user.id } });
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (!student || student.parentId !== parent?.id) {
        return res.status(403).json({ error: 'You can only confirm attendance for your own students' });
      }
    }

    const attendance = await prisma.attendance.create({
      data: {
        studentId,
        date: new Date(date),
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        observations
      },
      include: {
        student: { select: { firstName: true, lastName: true, grade: true } }
      }
    });

    res.status(201).json(attendance);
  } catch (error) { next(error); }
};

const getStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 86400000);

    const todayCount = await prisma.attendance.count({
      where: { date: { gte: today, lt: tomorrow } }
    });

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekCount = await prisma.attendance.count({
      where: { date: { gte: weekStart } }
    });

    res.json({ today: todayCount, week: weekCount });
  } catch (error) { next(error); }
};

module.exports = { getAll, create, getStats };
