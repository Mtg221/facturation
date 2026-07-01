"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    const adminPassword = await bcrypt.hash('Admin@12345', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@facturation.com' },
        update: {},
        create: {
            email: 'admin@facturation.com',
            nom: 'Admin',
            prenom: 'Super',
            motDePasse: adminPassword,
            role: 'ADMIN',
            isActive: true,
        },
    });
    const comptablePassword = await bcrypt.hash('Comptable@123', 12);
    await prisma.user.upsert({
        where: { email: 'comptable@facturation.com' },
        update: {},
        create: {
            email: 'comptable@facturation.com',
            nom: 'Diallo',
            prenom: 'Mariama',
            motDePasse: comptablePassword,
            role: 'COMPTABLE',
            isActive: true,
        },
    });
    const secteurs = await Promise.all([
        prisma.secteursActivite.upsert({
            where: { nom: 'Commerce et Distribution' },
            update: {},
            create: { nom: 'Commerce et Distribution', description: 'Vente et distribution de produits' },
        }),
        prisma.secteursActivite.upsert({
            where: { nom: 'Informatique et Technologies' },
            update: {},
            create: { nom: 'Informatique et Technologies', description: 'Services IT et technologie' },
        }),
        prisma.secteursActivite.upsert({
            where: { nom: 'Construction et BTP' },
            update: {},
            create: { nom: 'Construction et BTP', description: 'Bâtiment et travaux publics' },
        }),
        prisma.secteursActivite.upsert({
            where: { nom: 'Agro-alimentaire' },
            update: {},
            create: { nom: 'Agro-alimentaire', description: 'Production et transformation alimentaire' },
        }),
        prisma.secteursActivite.upsert({
            where: { nom: 'Transport et Logistique' },
            update: {},
            create: { nom: 'Transport et Logistique', description: 'Transport de personnes et marchandises' },
        }),
    ]);
    const client1 = await prisma.client.upsert({
        where: { code: 'CLI-2024-0001' },
        update: {},
        create: {
            code: 'CLI-2024-0001',
            nom: 'Société SARL TechSolutions',
            email: 'contact@techsolutions.sn',
            telephone1: '+221 33 820 00 01',
            adresse: '45 Rue de l\'Innovation, Zone Industrielle',
            ville: 'Dakar',
            pays: 'Sénégal',
            ninea: '123456789',
            secteurs: { create: [{ secteurId: secteurs[1].id }] },
        },
    });
    const client2 = await prisma.client.upsert({
        where: { code: 'CLI-2024-0002' },
        update: {},
        create: {
            code: 'CLI-2024-0002',
            nom: 'Groupe Import-Export Alpha',
            email: 'direction@alpha-import.sn',
            telephone1: '+221 77 543 21 09',
            adresse: 'BP 1234, Port de Dakar',
            ville: 'Dakar',
            pays: 'Sénégal',
            secteurs: { create: [{ secteurId: secteurs[0].id }] },
        },
    });
    const produits = await Promise.all([
        prisma.produit.upsert({
            where: { reference: 'SVC-DEV-001' },
            update: {},
            create: {
                reference: 'SVC-DEV-001',
                designation: 'Développement logiciel (journée)',
                description: 'Développement d\'applications web et mobile',
                prix: 150000,
                tva: 18,
                unite: 'jour',
            },
        }),
        prisma.produit.upsert({
            where: { reference: 'SVC-CONS-001' },
            update: {},
            create: {
                reference: 'SVC-CONS-001',
                designation: 'Consultation IT (heure)',
                description: 'Conseil et expertise informatique',
                prix: 25000,
                tva: 18,
                unite: 'heure',
            },
        }),
        prisma.produit.upsert({
            where: { reference: 'SVC-FORM-001' },
            update: {},
            create: {
                reference: 'SVC-FORM-001',
                designation: 'Formation (journée)',
                description: 'Formation professionnelle sur mesure',
                prix: 200000,
                tva: 18,
                unite: 'jour',
            },
        }),
        prisma.produit.upsert({
            where: { reference: 'MAT-ORD-001' },
            update: {},
            create: {
                reference: 'MAT-ORD-001',
                designation: 'Ordinateur portable professionnel',
                description: 'Laptop 15" Intel Core i7, 16GB RAM, 512GB SSD',
                prix: 850000,
                tva: 18,
                unite: 'unité',
            },
        }),
    ]);
    const facture = await prisma.facture.create({
        data: {
            numero: 'FACT-2024-00001',
            clientId: client1.id,
            userId: admin.id,
            statut: 'ENVOYEE',
            dateEmission: new Date('2024-01-15'),
            dateEcheance: new Date('2024-02-15'),
            remiseGlobale: 0,
            montantHT: 450000,
            montantTVA: 81000,
            montantTTC: 531000,
            montantPaye: 0,
            resteAPayer: 531000,
            montantEnLettres: 'Cinq cent trente et un mille FCFA',
            notes: 'Projet de développement de plateforme e-commerce',
            conditionsPaiement: 'Paiement à 30 jours',
            details: {
                create: [
                    {
                        produitId: produits[0].id,
                        designation: 'Développement logiciel (journée)',
                        quantite: 3,
                        prixUnitaire: 150000,
                        tva: 18,
                        remise: 0,
                        montantHT: 450000,
                        montantTVA: 81000,
                        montantTTC: 531000,
                        ordre: 0,
                    },
                ],
            },
        },
    });
    await prisma.paiement.create({
        data: {
            factureId: facture.id,
            userId: admin.id,
            montant: 200000,
            mode: 'VIREMENT',
            reference: 'VIR-2024-001',
            commentaire: 'Acompte 40%',
            datePaiement: new Date('2024-01-20'),
        },
    });
    await prisma.facture.update({
        where: { id: facture.id },
        data: {
            montantPaye: 200000,
            resteAPayer: 331000,
            statut: 'PARTIELLEMENT_PAYEE',
        },
    });
    console.log('✅ Database seeded successfully!');
    console.log('');
    console.log('👤 Admin credentials:');
    console.log('   Email    : admin@facturation.com');
    console.log('   Password : Admin@12345');
    console.log('');
    console.log('👤 Comptable credentials:');
    console.log('   Email    : comptable@facturation.com');
    console.log('   Password : Comptable@123');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map