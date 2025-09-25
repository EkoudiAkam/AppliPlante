# 🌱 Plant Care API

Une API de gestion de plantes d'intérieur développée avec **NestJS** et **PostgreSQL (Prisma ORM)**.  
Elle permet aux utilisateurs de gérer leurs plantes, suivre les besoins en eau, recevoir des rappels d’arrosage et consulter l’historique d’entretien.

---

## 🚀 Fonctionnalités

### 🔐 Authentification & Sécurité
- Inscription et connexion utilisateur
- JWT (access & refresh tokens)
- Hachage des mots de passe avec **bcrypt**
- Guards d’authentification
- Rate limiting (100 requêtes/minute)
- Gestion globale des erreurs

### 👤 Gestion des Utilisateurs
- Création et mise à jour du profil
- Suppression de compte
- Statistiques utilisateur (nombre de plantes, arrosages)

### 🪴 Gestion des Plantes
- CRUD complet des plantes
- Informations : nom, espèce, fréquence d’arrosage, localisation, notes, image
- Calcul automatique de la prochaine date d’arrosage
- Recherche et filtrage

### 💧 Suivi des Arrosages
- Enregistrement des arrosages avec quantité et notes
- Historique complet par plante
- Statistiques (total, moyenne, plus récents)
- Mise à jour automatique de la prochaine date d’arrosage

### 🔔 Notifications
- Notifications push via **Web Push API**
- Rappels personnalisés selon la fréquence
- Vérification quotidienne des plantes à arroser
- Abonnements/désabonnements aux notifications
- Clés VAPID configurées

### 📊 Logging & Monitoring
- Intercepteur de logging (requêtes/réponses, temps de réponse, IP, User-Agent)
- Protection contre les attaques DoS

---

## 🛠️ Stack Technique

- **Backend** : NestJS (TypeScript)
- **Base de données** : PostgreSQL + Prisma ORM
- **Auth** : JWT + bcrypt
- **Notifications** : Web Push API + VAPID
- **Documentation API** : Swagger UI (auto-générée)

---

## 📂 Structure des Modules

- `AuthModule` → Authentification & sécurité
- `UsersModule` → Gestion des utilisateurs
- `PlantsModule` → Gestion des plantes
- `WateringsModule` → Suivi des arrosages
- `NotificationsModule` → Notifications push
- `PrismaModule` → Accès base de données

---

## 🗄️ Modèle de Données (Prisma)

```prisma
User {
  id          String   @id @default(uuid())
  email       String   @unique
  password    String
  firstname   String
  lastname    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  plants      Plant[]
  waterings   Watering[]
  subscriptions PushSubscription[]
}

Plant {
  id            String   @id @default(uuid())
  name          String
  species       String?
  waterFrequency Int
  location      String?
  notes         String?
  image         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  waterings     Watering[]
}

Watering {
  id        String   @id @default(uuid())
  amountMl  Int
  note      String?
  date      DateTime @default(now())
  plantId   String
  userId    String
  plant     Plant    @relation(fields: [plantId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
}

PushSubscription {
  id        String   @id @default(uuid())
  endpoint  String
  keys      Json
  userId    String
  user      User     @relation(fields: [userId], references: [id])
}
