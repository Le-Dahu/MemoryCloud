# MemoryCloud Database Schema

Ce dossier contient le schéma de base de données pour MemoryCloud, conçu pour Supabase (PostgreSQL).

## Structure de la base de données

### Tables principales

1. **projects** - Projets utilisateurs avec intégration optionnelle Zep
2. **api_keys** - Clés API hachées pour l'authentification
3. **sessions** - Sessions de conversation au sein des projets
4. **messages** - Messages individuels dans les sessions

### Fonctionnalités

- ✅ **Row Level Security (RLS)** - Chaque utilisateur n'accède qu'à ses propres données
- ✅ **Triggers automatiques** - `updated_at` mis à jour automatiquement
- ✅ **Index optimisés** - Pour les requêtes fréquentes sur user_id, project_id, session_id
- ✅ **Clés étrangères** - Avec CASCADE pour maintenir l'intégrité référentielle
- ✅ **Contraintes** - Validation des rôles de messages

## Installation du schéma

### Méthode 1 : Via l'interface Supabase (Recommandé)

1. Connectez-vous à votre projet Supabase sur https://supabase.com/dashboard
2. Allez dans **SQL Editor** dans le menu de gauche
3. Cliquez sur **New Query**
4. Copiez le contenu de `schema.sql`
5. Collez-le dans l'éditeur SQL
6. Cliquez sur **Run** ou appuyez sur `Ctrl+Enter`

### Méthode 2 : Via la CLI Supabase

```bash
# Installation de la CLI Supabase (si nécessaire)
npm install -g supabase

# Connexion à votre projet
supabase login

# Lier votre projet local
supabase link --project-ref YOUR_PROJECT_REF

# Exécuter le schéma
supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" < src/db/schema.sql
```

### Méthode 3 : Via psql

```bash
# Connexion directe via psql
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f src/db/schema.sql
```

## Vérification de l'installation

Après avoir exécuté le schéma, vérifiez que tout est en place :

```sql
-- Vérifier les tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('projects', 'api_keys', 'sessions', 'messages');

-- Vérifier les policies RLS
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';

-- Vérifier les triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- Vérifier les index
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## Configuration des variables d'environnement

Après avoir créé votre base de données, ajoutez les informations de connexion dans votre fichier `.env` :

```env
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]
```

Vous pouvez trouver ces valeurs dans :
- **Project Settings** > **API** dans votre dashboard Supabase

## Sécurité : Row Level Security (RLS)

Toutes les tables ont RLS activé. Les politiques garantissent que :

- Les utilisateurs ne peuvent voir/modifier que leurs propres données
- L'accès aux sessions et messages est contrôlé via la relation avec les projets
- Les clés API sont isolées par utilisateur

## Migrations futures

Pour modifier le schéma après la première installation :

1. Créez un nouveau fichier de migration dans ce dossier (ex: `001_add_feature.sql`)
2. Exécutez-le via la même méthode que le schéma initial
3. Documentez les changements dans ce README

## Exemple d'utilisation

```sql
-- Insérer un projet (en tant qu'utilisateur authentifié)
INSERT INTO projects (user_id, name, description)
VALUES (auth.uid(), 'Mon Premier Projet', 'Description du projet');

-- Créer une session
INSERT INTO sessions (project_id, source)
VALUES ('project-uuid-here', 'mcp');

-- Ajouter un message
INSERT INTO messages (session_id, role, content)
VALUES ('session-uuid-here', 'user', 'Bonjour MemoryCloud!');
```

## Support

Pour toute question ou problème avec le schéma :
- Vérifiez les logs dans Supabase Dashboard > Database > Logs
- Consultez la documentation Supabase : https://supabase.com/docs
- Vérifiez que l'extension `uuid-ossp` est activée
