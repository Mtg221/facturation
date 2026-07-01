const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Production seed...');

  // Supprimer les comptes de démo créés par l'ancien seed
  const demoEmails = [
    'admin@facturation.com',
    'comptable@facturation.com',
    'manager@facturation.com',
    'caissier@facturation.com',
  ];
  const deleted = await prisma.user.deleteMany({
    where: { email: { in: demoEmails } },
  });
  if (deleted.count > 0) console.log(`🗑️  ${deleted.count} compte(s) démo supprimé(s)`);

  const societe = await prisma.societe.upsert({
    where: { id: 'default-societe-id' },
    update: {},
    create: {
      id: 'default-societe-id',
      nom: '2M Logistique et Transport',
      adresse: 'Quartier Thiokhna, Louga, Sénégal',
      telephone: '(+221) 77 533 65 33 - 33 967 45 10',
      email: 'mohasafiedine@gmail.com',
      ninea: '008740947 2H2',
      rc: 'SN-LGA-2021-B-991',
      banque: 'Bicis Louga N°SN0100753400077537000010-33',
      isActive: true,
    },
  });
  console.log('✅ Société:', societe.nom);

  const superAdminPassword = await bcrypt.hash('SuperREDACTED', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@plateforme.sn' },
    update: {},
    create: {
      email: 'superadmin@plateforme.sn',
      nom: 'Super',
      prenom: 'Admin',
      motDePasse: superAdminPassword,
      role: 'SUPERADMIN',
      isActive: true,
    },
  });
  console.log('✅ SUPERADMIN:', superAdmin.email);

  const adminPassword = await bcrypt.hash('REDACTED', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@2mlogistique.sn' },
    update: {},
    create: {
      email: 'admin@2mlogistique.sn',
      nom: 'Admin',
      prenom: '2M',
      motDePasse: adminPassword,
      role: 'ADMIN',
      isActive: true,
      societeId: societe.id,
    },
  });
  console.log('✅ ADMIN:', admin.email);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
