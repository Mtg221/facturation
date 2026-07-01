import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Production seed...');

  // 1. Créer la société par défaut
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
  console.log('✅ Société créée:', societe.nom);

  // 2. Créer le SUPERADMIN (sans societeId)
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
  console.log('✅ SUPERADMIN créé:', superAdmin.email);

  // 3. Créer l'ADMIN de la société par défaut
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
  console.log('✅ ADMIN société créé:', admin.email);

  console.log('\n📋 Comptes créés:');
  console.log('  SUPERADMIN : superadmin@plateforme.sn / SuperREDACTED');
  console.log('  ADMIN      : admin@2mlogistique.sn / REDACTED');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
