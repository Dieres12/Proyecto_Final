// src/controllers/reportController.js - Dashboard stats and reports
const prisma = require('../config/prisma');

const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const [
      totalStudents,
      totalBuses,
      totalDrivers,
      totalRoutes,
      pendingPayments,
      approvedPayments,
      todayAttendance,
      activeBuses,
      recentPayments,
      recentAttendances
    ] = await Promise.all([
      prisma.student.count({ where: { active: true } }),
      prisma.bus.count({ where: { active: true } }),
      prisma.driver.count({ where: { active: true } }),
      prisma.route.count({ where: { active: true } }),
      prisma.payment.count({ where: { status: 'PENDIENTE', month, year } }),
      prisma.payment.count({ where: { status: 'VALIDADO', month, year } }),
      prisma.attendance.count({
        where: {
          date: {
            gte: new Date(now.setHours(0, 0, 0, 0)),
            lt: new Date(now.setHours(23, 59, 59, 999))
          }
        }
      }),
      prisma.bus.count({ where: { active: true, currentLat: { not: null } } }),
      prisma.payment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          parent: { select: { firstName: true, lastName: true } },
          receipt: { select: { id: true } }
        }
      }),
      prisma.attendance.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { select: { firstName: true, lastName: true, grade: true } }
        }
      })
    ]);

    res.json({
      stats: {
        totalStudents,
        totalBuses,
        totalDrivers,
        totalRoutes,
        pendingPayments,
        approvedPayments,
        todayAttendance,
        activeBuses
      },
      recentPayments,
      recentAttendances
    });
  } catch (error) { next(error); }
};

const getPaymentReport = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const where = {};
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);

    const payments = await prisma.payment.findMany({
      where,
      include: {
        parent: { select: { firstName: true, lastName: true } },
        receipt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const summary = {
      total: payments.length,
      pendiente: payments.filter(p => p.status === 'PENDIENTE').length,
      validado: payments.filter(p => p.status === 'VALIDADO').length,
      rechazado: payments.filter(p => p.status === 'RECHAZADO').length,
      totalAmount: payments.filter(p => p.status === 'VALIDADO').reduce((sum, p) => sum + p.amount, 0)
    };

    res.json({ summary, payments });
  } catch (error) { next(error); }
};

const getStudentsByRoute = async (req, res, next) => {
  try {
    const routes = await prisma.route.findMany({
      where: { active: true },
      include: {
        students: {
          where: { active: true },
          include: { parent: { select: { firstName: true, lastName: true, phone: true } } }
        },
        bus: { select: { plate: true, model: true } },
        _count: { select: { students: true } }
      }
    });
    res.json(routes);
  } catch (error) { next(error); }
};

module.exports = { getDashboardStats, getPaymentReport, getStudentsByRoute };
