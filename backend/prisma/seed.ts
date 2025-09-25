import { PrismaClient } from '@prisma/client';
import * as bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding de la base de données...');

  // Nettoyer les données existantes
  await prisma.watering.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.plant.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Données existantes supprimées');

  // Créer des utilisateurs de test
  const hashedPassword = await bcryptjs.hash('password123', 10);

  const user1 = await prisma.user.create({
    data: {
      email: 'marie.dupont@example.com',
      passwordHash: hashedPassword,
      firstname: 'Marie',
      lastname: 'Dupont',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jean.martin@example.com',
      passwordHash: hashedPassword,
      firstname: 'Jean',
      lastname: 'Martin',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'sophie.bernard@example.com',
      passwordHash: hashedPassword,
      firstname: 'Sophie',
      lastname: 'Bernard',
    },
  });

  console.log('👥 Utilisateurs créés');

  // Créer des plantes pour Marie
  const mariePlants = await Promise.all([
    prisma.plant.create({
      data: {
        userId: user1.id,
        name: 'Monstera Deliciosa',
        species: 'Monstera deliciosa',
        purchaseDate: new Date('2023-03-15'),
        waterAmountMl: 300,
        waterFrequencyDays: 7,
        nextWateringAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Dans 2 jours
      },
    }),
    prisma.plant.create({
      data: {
        userId: user1.id,
        name: 'Ficus Lyrata',
        species: 'Ficus lyrata',
        purchaseDate: new Date('2023-05-20'),
        waterAmountMl: 250,
        waterFrequencyDays: 10,
        nextWateringAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Dans 5 jours
      },
    }),
    prisma.plant.create({
      data: {
        userId: user1.id,
        name: 'Pothos Doré',
        species: 'Epipremnum aureum',
        purchaseDate: new Date('2023-01-10'),
        waterAmountMl: 150,
        waterFrequencyDays: 5,
        nextWateringAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Demain
      },
    }),
  ]);

  // Créer des plantes pour Jean
  const jeanPlants = await Promise.all([
    prisma.plant.create({
      data: {
        userId: user2.id,
        name: 'Sansevieria',
        species: 'Sansevieria trifasciata',
        purchaseDate: new Date('2023-02-28'),
        waterAmountMl: 100,
        waterFrequencyDays: 14,
        nextWateringAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Dans 7 jours
      },
    }),
    prisma.plant.create({
      data: {
        userId: user2.id,
        name: 'Cactus de Noël',
        species: 'Schlumbergera',
        purchaseDate: new Date('2022-12-01'),
        waterAmountMl: 75,
        waterFrequencyDays: 10,
        nextWateringAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Dans 3 jours
      },
    }),
  ]);

  // Créer des plantes pour Sophie
  const sophiePlants = await Promise.all([
    prisma.plant.create({
      data: {
        userId: user3.id,
        name: 'Philodendron',
        species: 'Philodendron hederaceum',
        purchaseDate: new Date('2023-04-12'),
        waterAmountMl: 200,
        waterFrequencyDays: 6,
        nextWateringAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // Dans 4 jours
      },
    }),
    prisma.plant.create({
      data: {
        userId: user3.id,
        name: 'Zamioculcas',
        species: 'Zamioculcas zamiifolia',
        purchaseDate: new Date('2023-06-08'),
        waterAmountMl: 180,
        waterFrequencyDays: 12,
        nextWateringAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // Dans 8 jours
      },
    }),
    prisma.plant.create({
      data: {
        userId: user3.id,
        name: 'Aloe Vera',
        species: 'Aloe vera',
        purchaseDate: new Date('2023-07-22'),
        waterAmountMl: 120,
        waterFrequencyDays: 14,
        nextWateringAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Dans 10 jours
      },
    }),
  ]);

  console.log('🌿 Plantes créées');

  // Créer des arrosages historiques
  const allPlants = [...mariePlants, ...jeanPlants, ...sophiePlants];
  
  for (const plant of allPlants) {
    // Créer 3-5 arrosages historiques pour chaque plante
    const numberOfWaterings = Math.floor(Math.random() * 3) + 3; // 3 à 5 arrosages
    
    for (let i = 0; i < numberOfWaterings; i++) {
      const daysAgo = (i + 1) * plant.waterFrequencyDays + Math.floor(Math.random() * 3) - 1; // Variation de ±1 jour
      const wateringDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      await prisma.watering.create({
        data: {
          plantId: plant.id,
          userId: plant.userId,
          amountMl: plant.waterAmountMl + Math.floor(Math.random() * 50) - 25, // Variation de ±25ml
          note: i === 0 ? 'Arrosage avec engrais liquide' : undefined,
          createdAt: wateringDate,
        },
      });
    }
  }

  console.log('💧 Arrosages historiques créés');

  // Statistiques finales
  const userCount = await prisma.user.count();
  const plantCount = await prisma.plant.count();
  const wateringCount = await prisma.watering.count();

  console.log('✅ Seeding terminé !');
  console.log(`📊 Statistiques :`);
  console.log(`   - ${userCount} utilisateurs`);
  console.log(`   - ${plantCount} plantes`);
  console.log(`   - ${wateringCount} arrosages`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });