# GovAI Hub

Plateforme web bilingue, prioritairement en français, dédiée à la gouvernance interne des systèmes d’IA. Elle propose un registre centralisé, une évaluation des risques explicable, des audits de conformité, des actions correctives, une gestion des incidents, des décisions humaines documentées, une piste d’audit, des indicateurs de tableau de bord et la génération de rapports PDF.

> Prototype pédagogique réalisé dans le cadre d’un stage ENSIASD MGSI. Toutes les données sont fictives. GovAI Hub ne constitue ni un avis juridique, ni une certification réglementaire ou ISO, ni une évaluation officielle de conformité.

## Fonctionnalités implémentées

- Authentification par identifiants Auth.js et autorisation côté serveur fondée sur les rôles
- Gestion des utilisateurs et des départements
- Registre des systèmes d’IA avec enregistrement en plusieurs étapes
- Notation déterministe et explicable des risques de 0 à 100
- Recommandations de contrôles fondées sur des règles
- Processus d’audit de conformité avec éléments de preuve et constats
- Actions correctives avec preuves fournies par le responsable et suivi de leur réalisation
- Décisions de gouvernance : approuver, approuver sous conditions, rejeter, suspendre
- Signalement des incidents et mises à jour sécurisées de leur état
- Chronologie complète du système et événements d’audit
- Espace de travail et notifications adaptés aux rôles
- Tableau de bord de gouvernance avec indicateurs PostgreSQL et rapport PDF protégé
- Interface prioritairement en français avec préférence de langue anglaise
- Portefeuille fictif de démonstration, incluant RecruitAI

## Rôles

| Rôle | Responsabilités principales |
| --- | --- |
| Administrateur | Gère les utilisateurs et les départements ; peut accéder à tous les dossiers de gouvernance et les administrer. |
| Responsable d’un système d’IA | Enregistre les systèmes dont il est responsable, réalise les évaluations des risques, fournit les preuves liées aux actions et signale les incidents. |
| Auditeur risques et conformité | Audite les contrôles, consigne les constats et les preuves, signale et met à jour les incidents. |
| Approbateur de gouvernance | Examine les preuves et consigne des décisions de gouvernance justifiées. |
| Lecteur | Dispose d’un accès en lecture seule au registre et aux preuves de gouvernance. |

## Processus principal

```text
Enregistrer le système -> Évaluer le risque -> Auditer les contrôles -> Actions correctives
       -> Décision de gouvernance -> Gestion continue des incidents
```

Les scores de risque sont calculés localement à partir de règles TypeScript publiées. La description d’un système n’appelle jamais un service d’IA externe et n’influence pas silencieusement son score.

### Processus complet pour un système d’IA

Suivez cette séquence pour TalentMatch AI ou pour tout nouveau système.

| Étape | Rôle | Action dans GovAI Hub | Résultat / état suivant |
| --- | --- | --- | --- |
| 0. Configurer | Administrateur | Crée les utilisateurs, leur attribue des rôles et des départements. | Chaque participant ne voit que les actions autorisées par son rôle. |
| 1. Enregistrer | Responsable du système d’IA (Lina) | Enregistre le système, sa finalité, son responsable, ses données, son étape du cycle de vie et son niveau d’autonomie. | Le système est à l’état **Brouillon**. |
| 2. Évaluer le risque | Responsable | Répond au questionnaire de risque et enregistre l’évaluation. | Un score transparent, un niveau de risque, des facteurs et des contrôles recommandés sont créés. Le système passe à l’état **En cours d’examen**. |
| 3. Auditer les contrôles | Auditeur (Rayan) | Ouvre le système, vérifie chaque contrôle recommandé et consigne le résultat, le constat et les preuves. | Un score de conformité est créé. Si un contrôle n’est pas conforme, le système passe à l’état **Action requise**. |
| 4. Corriger les écarts | Responsable | Ouvre chaque action corrective attribuée, ajoute des preuves de mise en œuvre et la marque comme terminée. | Le nombre d’actions ouvertes revient à zéro. Les preuves restent dans la chronologie du système. |
| 5. Décider | Approbateur de gouvernance (Imane) | Examine le score, l’audit, les actions et les incidents. Consigne une décision accompagnée d’une justification obligatoire. | Le système devient **Approuvé**, **Approuvé sous conditions**, **Rejeté** ou **Suspendu**. |
| 6. Suivre | Responsable, auditeur, administrateur | Consulte les notifications, consigne de nouvelles évaluations après des changements majeurs et gère les incidents. | Le dossier de gouvernance reste actif et traçable. |

**Règle de décision :** une approbation ordinaire est bloquée tant que des actions correctives restent ouvertes. Une approbation conditionnelle doit contenir des conditions écrites.

### Processus complet de gestion d’un incident

| Étape | Rôle | Action dans GovAI Hub | Résultat / état suivant |
| --- | --- | --- | --- |
| 1. Identifier | Responsable, auditeur ou administrateur | Identifie un problème, par exemple une recommandation potentiellement biaisée, une divulgation imprévue ou un classement incorrect. | L’incident est prêt à être consigné. |
| 2. Signaler | Responsable (uniquement pour un système dont il est responsable), auditeur ou administrateur | Ouvre le dossier du système et renseigne un titre, le niveau de gravité, la date et l’heure de survenue, ainsi qu’une description factuelle. | L’incident est à l’état **Ouvert** ; un événement est créé dans la chronologie. |
| 3. Enquêter | Auditeur ou administrateur | Passe l’état à **En cours d’investigation** et consigne les notes d’enquête et les preuves. | L’incident reste visible dans le dossier du système et dans le compteur du tableau de bord. |
| 4. Résoudre | Auditeur ou administrateur | Documente la mesure corrective et passe l’état à **Résolu**. | La date et la note de résolution sont conservées. |
| 5. Clôturer | Auditeur ou administrateur | Confirme que la résolution est terminée et passe l’état à **Clôturé**. | L’incident reste dans la piste d’audit ; il n’est jamais supprimé. |

Les lecteurs et les approbateurs de gouvernance peuvent consulter les incidents dans le dossier du système, mais ne peuvent ni les signaler, ni les investiguer, ni les résoudre, ni les clôturer, ni les supprimer.

## Technologies

- Next.js 16 App Router, TypeScript, Tailwind CSS
- PostgreSQL (compatible Neon), Prisma 7 et migrations
- Auth.js, Zod, React Hook Form
- Recharts, pdf-lib, Vitest

## Structure du projet

```text
prisma/
  migrations/        Historique du schéma PostgreSQL
  schema.prisma      Modèle de données de gouvernance
  seed.ts            Données fictives de développement
src/
  app/               Pages App Router, Server Actions, gestionnaires de routes
  components/        Composants d’interface interactifs
  lib/auth/          Autorisation et rôles
  lib/data/          Couche de requêtes de base de données
  lib/risk-engine.ts Règles de notation explicables
  generated/prisma/  Client généré — ne pas modifier
docs/
  design-system.md   Guide de marque et d’expérience utilisateur
```

## Installation locale

Prérequis : Node.js, pnpm et une base de données PostgreSQL. Neon est pris en charge.

```bash
pnpm install
```

Créez `.env` à partir de `.env.example`, puis définissez `DATABASE_URL`, `AUTH_SECRET` et un `SEED_USER_PASSWORD` robuste.

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Ouvrez `http://localhost:3000`.

Pour une base de données déjà hébergée, appliquez les migrations validées avec :

```bash
pnpm db:deploy
pnpm db:seed
```

Ne validez jamais `.env`, des identifiants ou des mots de passe dans Git.

## Comptes de développement

Les données fictives utilisent le mot de passe initial stocké uniquement dans `SEED_USER_PASSWORD` de votre `.env` local.

| Rôle | E-mail |
| --- | --- |
| Administrateur | `amine.admin@govai.example` |
| Responsable d’un système d’IA | `nadia.hr@govai.example` |
| Responsable d’un système d’IA | `youssef.ops@govai.example` |
| Auditeur risques et conformité | `salma.audit@govai.example` |
| Approbateur de gouvernance | `omar.governance@govai.example` |

### Comptes supplémentaires pour le processus de démonstration

Ces comptes peuvent être créés par l’administrateur dans **Gestion des utilisateurs et des rôles** pour démontrer un processus complet et fluide. Leurs mots de passe correspondent aux valeurs choisies lors de la création des comptes et ne sont jamais stockés dans ce README.

| Rôle | Nom | E-mail suggéré | Département | Usage de démonstration |
| --- | --- | --- | --- | --- |
| Responsable d’un système d’IA | Lina Bensaid | `lina.owner@govai.example` | Ressources humaines | Responsable de TalentMatch AI, évalue le risque, réalise les actions correctives et signale les incidents. |
| Auditeur risques et conformité | Rayan El Mansouri | `rayan.auditor@govai.example` | Risques et conformité | Examine les contrôles, consigne les constats d’audit et met à jour les incidents. |
| Approbateur de gouvernance | Imane Ait Lahcen | `imane.approver@govai.example` | Gouvernance | Examine les preuves et consigne la décision finale de gouvernance. |

## Modèle de notation

- Données personnelles sensibles : +20
- Effet matériel sur les personnes : +25
- Décisions importantes prises de façon autonome : +20
- Absence d’examen humain formel : +15
- Explication insuffisante : +10
- Absence de mécanisme de recours : +10

Niveaux de risque : Faible (0-25), Modéré (26-50), Élevé (51-75), Critique (76-100).

## Gestion des incidents

Les responsables peuvent signaler des incidents uniquement pour leurs propres systèmes. Les auditeurs et les administrateurs peuvent signaler des incidents ; ils peuvent les faire passer par les états Ouvert, En cours d’investigation, Résolu et Clôturé. Les incidents ne peuvent pas être supprimés, ce qui préserve le dossier de gouvernance.

## Vérification

```bash
pnpm lint
pnpm test
pnpm build
```

Exécutez ces vérifications avant une démonstration ou un déploiement. Le rapport PDF et le tableau de bord utilisent les enregistrements actuels de la base de données et doivent être actualisés après toute modification pertinente du processus.


