/**
 * Script de migration one-shot à exécuter ENTRE Migration A et Migration B.
 *
 * Ordre d'exécution :
 *   1. npx prisma migrate dev --name add_societe_multitenant   (Migration A)
 *   2. npx ts-node prisma/seed-migration.ts                    (ce script)
 *   3. npx prisma migrate dev --name make_societe_required     (Migration B)
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Démarrage de la migration multi-tenant...');

  // 1. Créer la société par défaut (2M Logistique et Transport)
  const societeDefaut = await prisma.societe.upsert({
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
    },
  });
  console.log(`✅ Société par défaut créée : ${societeDefaut.nom}`);

  // 2. Assigner tous les utilisateurs existants à la société par défaut
  const usersUpdated = await prisma.user.updateMany({
    where: { societeId: null },
    data: { societeId: 'default-societe-id' },
  });
  console.log(`✅ ${usersUpdated.count} utilisateur(s) migrés`);

  // 3. Assigner tous les clients existants
  const clientsUpdated = await prisma.client.updateMany({
    where: { societeId: null },
    data: { societeId: 'default-societe-id' },
  });
  console.log(`✅ ${clientsUpdated.count} client(s) migrés`);

  // 4. Assigner tous les produits existants
  const produitsUpdated = await prisma.produit.updateMany({
    where: { societeId: null },
    data: { societeId: 'default-societe-id' },
  });
  console.log(`✅ ${produitsUpdated.count} produit(s) migrés`);

  // 5. Assigner toutes les factures existantes
  const facturesUpdated = await prisma.facture.updateMany({
    where: { societeId: null },
    data: { societeId: 'default-societe-id' },
  });
  console.log(`✅ ${facturesUpdated.count} facture(s) migrées`);

  // 6. Assigner tous les paiements existants
  const paiementsUpdated = await prisma.paiement.updateMany({
    where: { societeId: null },
    data: { societeId: 'default-societe-id' },
  });
  console.log(`✅ ${paiementsUpdated.count} paiement(s) migrés`);

  // 7. Assigner tous les secteurs existants
  const secteursUpdated = await prisma.secteursActivite.updateMany({
    where: { societeId: null },
    data: { societeId: 'default-societe-id' },
  });
  console.log(`✅ ${secteursUpdated.count} secteur(s) migrés`);

  // 8. Créer le compte SUPERADMIN plateforme (sans societeId)
  const superadminEmail = process.env.SUPERADMIN_EMAIL ?? 'superadmin@plateforme.sn';
  const superadminPassword = process.env.SUPERADMIN_PASSWORD ?? 'SuperREDACTED';

  const existingSuperadmin = await prisma.user.findUnique({ where: { email: superadminEmail } });
  if (!existingSuperadmin) {
    const hash = await bcrypt.hash(superadminPassword, 12);
    await prisma.user.create({
      data: {
        email: superadminEmail,
        nom: 'Super',
        prenom: 'Admin',
        motDePasse: hash,
        role: 'SUPERADMIN',
        societeId: null,
        isActive: true,
      },
    });
    console.log(`✅ Compte SUPERADMIN créé : ${superadminEmail}`);
    console.log(`   Mot de passe initial : ${superadminPassword}`);
    console.log(`   ⚠️  Changez ce mot de passe dès la première connexion !`);
  } else {
    console.log(`ℹ️  Compte SUPERADMIN déjà existant : ${superadminEmail}`);
  }

  console.log('\n✨ Migration multi-tenant terminée avec succès !');
  console.log('👉 Prochaine étape : npx prisma migrate dev --name make_societe_required');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de la migration :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
