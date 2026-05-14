// src/controllers/paymentController.js - Payment management with business rules
const prisma = require('../config/prisma');
const path = require('path');

/**
 * Business rule: payments only allowed on first 5 days of month
 */
const isPaymentWindowOpen = () => {
  const day = new Date().getDate();
  return day <= 5;
};

const getAll = async (req, res, next) => {
  try {
    const { status, month, year, parentId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (parentId) where.parentId = parentId;

    // PADRE sees only their own payments
    if (req.user.role === 'PADRE') {
      const parent = await prisma.parent.findUnique({ where: { userId: req.user.id } });
      if (parent) where.parentId = parent.id;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        parent: { select: { firstName: true, lastName: true } },
        receipt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(payments);
  } catch (error) { next(error); }
};

const getOne = async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: { parent: true, receipt: true }
    });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    // Enforce payment window rule
    if (!isPaymentWindowOpen() && req.user.role === 'PADRE') {
      return res.status(403).json({
        error: 'Payment window closed. Payments are only accepted during the first 5 days of each month.'
      });
    }

    const { amount, month, year, notes } = req.body;
    let { parentId } = req.body;

    // If PADRE, use their own parentId
    if (req.user.role === 'PADRE') {
      const parent = await prisma.parent.findUnique({ where: { userId: req.user.id } });
      if (!parent) return res.status(404).json({ error: 'Parent profile not found' });
      parentId = parent.id;
    }

    if (!amount || !month || !year) {
      return res.status(400).json({ error: 'amount, month and year are required' });
    }

    // Check for duplicate payment
    const existing = await prisma.payment.findFirst({
      where: { parentId, month: parseInt(month), year: parseInt(year), status: { not: 'RECHAZADO' } }
    });
    if (existing) {
      return res.status(400).json({ error: 'Payment for this month already exists' });
    }

    const payment = await prisma.payment.create({
      data: {
        parentId,
        amount: parseFloat(amount),
        month: parseInt(month),
        year: parseInt(year),
        notes
      },
      include: { parent: { select: { firstName: true, lastName: true } }, receipt: true }
    });

    res.status(201).json(payment);
  } catch (error) { next(error); }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    if (!['VALIDADO', 'RECHAZADO', 'PENDIENTE'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: { status, notes },
      include: { parent: { select: { firstName: true, lastName: true } }, receipt: true }
    });
    res.json(payment);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Payment not found' });
    next(error);
  }
};

const uploadReceipt = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { id } = req.params;
    const payment = await prisma.payment.findUnique({ where: { id }, include: { receipt: true } });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    const fileUrl = `/uploads/receipts/${req.file.filename}`;

    // Upsert receipt
    const receipt = await prisma.receipt.upsert({
      where: { paymentId: id },
      update: { fileUrl, fileName: req.file.originalname, fileType: req.file.mimetype },
      create: {
        paymentId: id,
        fileUrl,
        fileName: req.file.originalname,
        fileType: req.file.mimetype
      }
    });

    res.json({ message: 'Receipt uploaded', receipt });
  } catch (error) { next(error); }
};

module.exports = { getAll, getOne, create, updateStatus, uploadReceipt };
