// src/prisma/seed.js - Database seed with realistic data
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // =====================
  // USERS & ADMINS
  // =====================
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@genesis.gt' },
    update: {},
    create: {
      email: 'admin@genesis.gt',
      password: adminPassword,
      role: 'ADMIN'
    }
  });
  console.log('✅ Admin user created: admin@genesis.gt / admin123');

  // =====================
  // DRIVERS
  // =====================
  const drivers = await Promise.all([
    prisma.driver.upsert({
      where: { license: 'GT-001234' },
      update: {},
      create: { firstName: 'Carlos', lastName: 'Mendoza', license: 'GT-001234', phone: '5555-1001', email: 'cmendoza@genesis.gt' }
    }),
    prisma.driver.upsert({
      where: { license: 'GT-005678' },
      update: {},
      create: { firstName: 'María', lastName: 'López', license: 'GT-005678', phone: '5555-1002', email: 'mlopez@genesis.gt' }
    }),
    prisma.driver.upsert({
      where: { license: 'GT-009012' },
      update: {},
      create: { firstName: 'José', lastName: 'Ramírez', license: 'GT-009012', phone: '5555-1003', email: 'jramirez@genesis.gt' }
    })
  ]);
  console.log('✅ Drivers created');

  // =====================
  // BUSES
  // =====================
  const buses = await Promise.all([
    prisma.bus.upsert({
      where: { plate: 'P-001-GT' },
      update: {},
      create: { driverId: drivers[0].id, plate: 'P-001-GT', model: 'Toyota Coaster 2021', capacity: 25, currentLat: 14.6349, currentLng: -90.5069 }
    }),
    prisma.bus.upsert({
      where: { plate: 'P-002-GT' },
      update: {},
      create: { driverId: drivers[1].id, plate: 'P-002-GT', model: 'Mitsubishi Rosa 2020', capacity: 30, currentLat: 14.6100, currentLng: -90.5300 }
    }),
    prisma.bus.upsert({
      where: { plate: 'P-003-GT' },
      update: {},
      create: { driverId: drivers[2].id, plate: 'P-003-GT', model: 'Isuzu NQR 2022', capacity: 35, currentLat: 14.6349, currentLng: -90.5069 }
    })
  ]);
  console.log('✅ Buses created');

  // =====================
  // ROUTES WITH STOPS
  // =====================
  const routeNorte = await prisma.route.upsert({
    where: { id: 'route-norte-001' },
    update: {},
    create: {
      id: 'route-norte-001',
      busId: buses[0].id,
      name: 'Ruta Norte - Zona 6',
      description: 'Centro Histórico → Zona 6',
      stops: {
        create: [
          { name: 'Escuela Génesis', lat: 14.6349, lng: -90.5069, order: 1 },
          { name: 'Parada Zona 2', lat: 14.6400, lng: -90.5100, order: 2 },
          { name: 'Parada Zona 3', lat: 14.6450, lng: -90.5150, order: 3 },
          { name: 'Parada Zona 4', lat: 14.6500, lng: -90.5200, order: 4 },
          { name: 'Terminal Zona 6', lat: 14.6600, lng: -90.5300, order: 5 }
        ]
      }
    }
  });

  const routeSur = await prisma.route.upsert({
    where: { id: 'route-sur-002' },
    update: {},
    create: {
      id: 'route-sur-002',
      busId: buses[1].id,
      name: 'Ruta Sur - Zona 12',
      description: 'Zona 12 → Centro Histórico',
      stops: {
        create: [
          { name: 'Villa Nueva', lat: 14.6100, lng: -90.5300, order: 1 },
          { name: 'Parada Zona 11', lat: 14.6150, lng: -90.5250, order: 2 },
          { name: 'Parada Zona 10', lat: 14.6200, lng: -90.5200, order: 3 },
          { name: 'Parada Zona 9', lat: 14.6250, lng: -90.5150, order: 4 },
          { name: 'Escuela Génesis', lat: 14.6349, lng: -90.5069, order: 5 }
        ]
      }
    }
  });

  const routeEste = await prisma.route.upsert({
    where: { id: 'route-este-003' },
    update: {},
    create: {
      id: 'route-este-003',
      busId: buses[2].id,
      name: 'Ruta Este - Zona 15',
      description: 'Centro → Carretera a El Salvador',
      stops: {
        create: [
          { name: 'Escuela Génesis', lat: 14.6349, lng: -90.5069, order: 1 },
          { name: 'Vista Hermosa', lat: 14.6320, lng: -90.4900, order: 2 },
          { name: 'Muxbal', lat: 14.6280, lng: -90.4750, order: 3 },
          { name: 'Santa Catarina Pinula', lat: 14.6300, lng: -90.4600, order: 4 }
        ]
      }
    }
  });
  console.log('✅ Routes and stops created');

  // =====================
  // PARENTS & STUDENTS
  // =====================
  const parentData = [
    { email: 'padre1@test.com', firstName: 'Roberto', lastName: 'García', phone: '5555-2001', routeId: routeNorte.id },
    { email: 'padre2@test.com', firstName: 'Ana', lastName: 'Martínez', phone: '5555-2002', routeId: routeSur.id },
    { email: 'padre3@test.com', firstName: 'Luis', lastName: 'Pérez', phone: '5555-2003', routeId: routeEste.id },
    { email: 'padre4@test.com', firstName: 'Carmen', lastName: 'Rodríguez', phone: '5555-2004', routeId: routeNorte.id },
    { email: 'padre5@test.com', firstName: 'Miguel', lastName: 'González', phone: '5555-2005', routeId: routeSur.id },
  ];

  const studentNames = [
    ['Sofía', 'García', '3ro Primaria'],
    ['Diego', 'Martínez', '5to Primaria'],
    ['Valentina', 'Pérez', '2do Básico'],
    ['Alejandro', 'Rodríguez', '1ro Primaria'],
    ['Isabella', 'González', '4to Primaria'],
    ['Matías', 'García', '6to Primaria'],
    ['Emma', 'Martínez', '3ro Básico'],
  ];

  let studentIdx = 0;
  for (const pd of parentData) {
    const parentPassword = await bcrypt.hash('padre123', 10);
    const user = await prisma.user.upsert({
      where: { email: pd.email },
      update: {},
      create: { email: pd.email, password: parentPassword, role: 'PADRE' }
    });

    const parent = await prisma.parent.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, firstName: pd.firstName, lastName: pd.lastName, phone: pd.phone }
    });

    // Create 1-2 students per parent
    const count = studentIdx < 5 ? 1 : 2;
    for (let i = 0; i < count && studentIdx < studentNames.length; i++, studentIdx++) {
      const [fn, ln, grade] = studentNames[studentIdx];
      await prisma.student.create({
        data: {
          parentId: parent.id,
          routeId: pd.routeId,
          firstName: fn,
          lastName: ln,
          grade,
          section: 'A'
        }
      }).catch(() => {}); // ignore if exists
    }

    // Create a sample payment
    const now = new Date();
    await prisma.payment.create({
      data: {
        parentId: parent.id,
        amount: 450.00,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        status: studentIdx % 3 === 0 ? 'PENDIENTE' : 'VALIDADO',
        notes: 'Pago mensual transporte escolar'
      }
    }).catch(() => {});
  }

  console.log('✅ Parents and students created');
  console.log('\n📋 Test credentials:');
  console.log('   Admin: admin@genesis.gt / admin123');
  console.log('   Padre: padre1@test.com / padre123');
  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
