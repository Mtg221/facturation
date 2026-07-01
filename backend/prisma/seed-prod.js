const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Production seed...');

  // Désactiver les comptes de démo (ne pas supprimer à cause des FK)
  const demoEmails = [
    'admin@facturation.com',
    'comptable@facturation.com',
    'manager@facturation.com',
    'caissier@facturation.com',
    'superadmin@plateforme.sn',
    'admin@2mlogistique.sn',
  ];
  const disabled = await prisma.user.updateMany({
    where: { email: { in: demoEmails } },
    data: { isActive: false },
  });
  if (disabled.count > 0) console.log(`🔒 ${disabled.count} compte(s) démo désactivé(s)`);

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

  const superAdminRawPassword = process.env.SEED_SUPERADMIN_PASSWORD;
  if (!superAdminRawPassword) throw new Error('SEED_SUPERADMIN_PASSWORD env var is required');
  const superAdminPassword = await bcrypt.hash(superAdminRawPassword, 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'asstallfils@gmail.com' },
    update: { emailVerified: true, motDePasse: superAdminPassword },
    create: {
      email: 'asstallfils@gmail.com',
      nom: 'Makhemout',
      prenom: 'Admin',
      motDePasse: superAdminPassword,
      role: 'SUPERADMIN',
      isActive: true,
      emailVerified: true,
    },
  });
  console.log('✅ SUPERADMIN:', superAdmin.email);

}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
