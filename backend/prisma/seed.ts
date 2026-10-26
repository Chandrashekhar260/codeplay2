import process from 'node:process';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Srujana database seed...');

  const samplePasswordHash = await bcrypt.hash('Password123!', 12);

  // 1. Create Sample MSME Workspace (Clearly marked as Demo/Sample)
  const tenant = await prisma.tenant.upsert({
    where: { id: 'sample-tenant-aarogya-clinic' },
    update: {},
    create: {
      id: 'sample-tenant-aarogya-clinic',
      name: 'Aarogya Diagnostic Center & Polyclinic (Sample Data)',
      plan: 'STARTER',
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Sample Tenant: ${tenant.name} (${tenant.id})`);

  // 2. Roles
  const adminRole = await prisma.role.upsert({
    where: {
      tenantId_roleCode: {
        tenantId: tenant.id,
        roleCode: 'ADMIN',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      roleCode: 'ADMIN',
      name: 'Managing Partner / Admin',
      isSystem: true,
    },
  });

  // 3. Sample User (Ramesh Kumar)
  const user = await prisma.user.upsert({
    where: { email: 'ramesh.kumar@aarogyadiagnostics.in' },
    update: {
      passwordHash: samplePasswordHash,
    },
    create: {
      id: 'sample-user-ramesh-kumar',
      tenantId: tenant.id,
      email: 'ramesh.kumar@aarogyadiagnostics.in',
      passwordHash: samplePasswordHash,
      firstName: 'Ramesh',
      lastName: 'Kumar',
      isPlatformAdmin: false,
    },
  });

  await prisma.userRole.upsert({
    where: {
      tenantId_userId_roleCode: {
        tenantId: tenant.id,
        userId: user.id,
        roleCode: adminRole.roleCode,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: user.id,
      roleCode: adminRole.roleCode,
    },
  });

  console.log(`✅ Sample User: ${user.email} (Password: Password123!)`);

  // 3b. Sample Citizen Account (Rahul Sharma - Data Principal)
  const citizenTenant = await prisma.tenant.upsert({
    where: { id: 'tenant-citizen-rahul-vault' },
    update: {},
    create: {
      id: 'tenant-citizen-rahul-vault',
      name: "Rahul Sharma's Personal Vault",
      plan: 'CITIZEN',
      status: 'ACTIVE',
    },
  });

  const citizenRole = await prisma.role.upsert({
    where: {
      tenantId_roleCode: {
        tenantId: citizenTenant.id,
        roleCode: 'CITIZEN',
      },
    },
    update: {},
    create: {
      tenantId: citizenTenant.id,
      roleCode: 'CITIZEN',
      name: 'Individual Data Principal',
      isSystem: true,
    },
  });

  const citizenUser = await prisma.user.upsert({
    where: { email: 'rahul.sharma@citizen.in' },
    update: {
      passwordHash: samplePasswordHash,
    },
    create: {
      id: 'user-citizen-rahul-sharma',
      tenantId: citizenTenant.id,
      email: 'rahul.sharma@citizen.in',
      passwordHash: samplePasswordHash,
      firstName: 'Rahul',
      lastName: 'Sharma',
      isPlatformAdmin: false,
    },
  });

  await prisma.userRole.upsert({
    where: {
      tenantId_userId_roleCode: {
        tenantId: citizenTenant.id,
        userId: citizenUser.id,
        roleCode: citizenRole.roleCode,
      },
    },
    update: {},
    create: {
      tenantId: citizenTenant.id,
      userId: citizenUser.id,
      roleCode: citizenRole.roleCode,
    },
  });

  console.log(`✅ Sample Citizen: ${citizenUser.email} (Password: Password123!)`);

  // 4. Sample DPDPA Purposes
  const purpose1 = await prisma.purpose.upsert({
    where: { purposeId: 'purpose-lab-reports' },
    update: {},
    create: {
      purposeId: 'purpose-lab-reports',
      tenantId: tenant.id,
      name: 'Diagnostic Lab Test Report Delivery',
      legalBasis: 'DPDPA_SEC_6_CONSENT',
      version: '1.0',
      description: 'Delivering blood test, biochemistry, and pathology reports to patient phone/WhatsApp',
    },
  });

  const purpose2 = await prisma.purpose.upsert({
    where: { purposeId: 'purpose-tax-invoicing' },
    update: {},
    create: {
      purposeId: 'purpose-tax-invoicing',
      tenantId: tenant.id,
      name: 'Statutory Patient Invoicing & Tax Defense',
      legalBasis: 'CGST_SEC_36_STATUTORY',
      version: '1.0',
      description: 'Retaining GST invoice billing data for mandatory 72-month period',
    },
  });

  console.log(`✅ Seeded ${[purpose1.name, purpose2.name].length} sample purposes`);

  // 5. Sample Audit Log
  await prisma.auditEvent.create({
    data: {
      tenantId: tenant.id,
      actorId: user.id,
      action: 'WORKSPACE_INITIALIZED',
      resourceType: 'TENANT',
      resourceId: tenant.id,
      diffJson: JSON.stringify({ message: 'Sample seed workspace configured' }),
    },
  });

  console.log('✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
