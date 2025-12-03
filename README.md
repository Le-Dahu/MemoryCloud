# MemoryCloud

MemoryCloud - Service de mémoire inter-IA accessible via MCP (Model Context Protocol)

## 🏗️ Structure

- `apps/api` - API Fastify + TypeScript backend
- `packages/mcp-server` - Serveur MCP pour intégration Claude Desktop
- `docs/` - Documentation
- `.bmad-core/` - Framework BMAD Method pour développement structuré

## 🚀 Démarrage rapide

### 1. Installation

```bash
# Cloner le repo
git clone https://github.com/Le-Dahu/MemoryCloud.git
cd MemoryCloud

# Installer les dépendances
pnpm install
```

### 2. Configuration de l'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env avec vos credentials Supabase
nano .env
```

Configuration requise dans `.env` :
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ZEP_API_KEY=your-zep-api-key  # REQUIS - ZEP est le cœur du produit
PORT=3000
```

### 3. Configurer ZEP Cloud

**ZEP Cloud** est le cœur de MemoryCloud - il fournit la mémoire sémantique inter-IA.

1. Créez un compte sur [ZEP Cloud](https://app.getzep.com)
2. Générez une API key dans les paramètres
3. Ajoutez la clé dans votre `.env` : `ZEP_API_KEY=z_your_key_here`

**Comment fonctionne l'intégration ZEP** :
- Chaque projet utilise son `project_id` comme identifiant de session ZEP
- Les sessions ZEP sont créées automatiquement lors du premier message
- La recherche sémantique utilise l'API `memory.search()` de ZEP
- Pas besoin de créer des collections - tout est géré automatiquement

### 4. Initialiser la base de données

1. Connectez-vous à [Supabase Dashboard](https://supabase.com/dashboard)
2. Allez dans **SQL Editor** → **New Query**
3. Copiez et exécutez le contenu de `apps/api/src/db/schema.sql`
4. Vérifiez que les tables sont créées : `projects`, `api_keys`, `sessions`, `messages`

### 5. Démarrer l'API

```bash
# Mode développement (auto-reload)
pnpm dev

# L'API sera disponible sur http://localhost:3000
```

### 6. Générer une API Key

```bash
# Via script CLI
pnpm --filter api generate-key test-user-id "Claude Desktop"

# Ou via API (nécessite que le serveur soit démarré)
curl -X POST http://localhost:3000/api/v1/api-keys \
  -H "Content-Type: application/json" \
  -d '{"name": "Claude Desktop"}'
```

⚠️ **Important** : Copiez la clé immédiatement, elle ne sera plus jamais affichée !

Exemple de clé : `mc_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

## 🔧 Configuration Claude Desktop

### 1. Build le serveur MCP

```bash
pnpm --filter mcp-server build
```

### 2. Configurer Claude Desktop

Éditez `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
ou `%APPDATA%\Claude\claude_desktop_config.json` (Windows)

```json
{
  "mcpServers": {
    "memorycloud": {
      "command": "node",
      "args": ["/chemin/absolu/vers/MemoryCloud/packages/mcp-server/dist/index.js"],
      "env": {
        "MEMORYCLOUD_API_URL": "http://localhost:3000",
        "MEMORYCLOUD_API_KEY": "mc_votre_cle_api_ici"
      }
    }
  }
}
```

### 3. Redémarrer Claude Desktop

Après configuration, redémarrez Claude Desktop pour charger le serveur MCP.

### 4. Tester les outils MCP

Dans Claude Desktop, vous pouvez maintenant utiliser :
- **list_projects** - Lister vos projets
- **create_project** - Créer un nouveau projet
- **record_interaction** - Enregistrer des messages
- **search_context** - Rechercher du contexte pertinent

## 📚 API Endpoints

### Santé
- `GET /health` - Vérifier l'état du serveur

### Projets
- `POST /api/v1/projects` - Créer un projet
- `GET /api/v1/projects` - Lister les projets
- `GET /api/v1/projects/:id` - Récupérer un projet
- `PUT /api/v1/projects/:id` - Mettre à jour un projet
- `DELETE /api/v1/projects/:id` - Supprimer un projet

### Sessions
- `POST /api/v1/projects/:projectId/sessions` - Créer une session
- `GET /api/v1/projects/:projectId/sessions` - Lister les sessions

### Messages
- `POST /api/v1/sessions/:sessionId/messages` - Ajouter un message
- `GET /api/v1/sessions/:sessionId/messages` - Récupérer les messages

### Contexte
- `POST /api/v1/projects/:projectId/context/search` - Rechercher du contexte

### API Keys
- `POST /api/v1/api-keys` - Générer une clé API
- `GET /api/v1/api-keys` - Lister vos clés
- `DELETE /api/v1/api-keys/:id` - Supprimer une clé

## 🔐 Authentification

Toutes les routes API (sauf `/health`) requièrent une API key dans le header :

```bash
Authorization: Bearer mc_your_api_key_here
```

## 🛠️ Développement

### Scripts disponibles

```bash
# API Backend
pnpm dev                    # Démarrer l'API en mode dev
pnpm build                  # Build tous les packages
pnpm --filter api build     # Build uniquement l'API

# MCP Server
pnpm --filter mcp-server dev     # Serveur MCP en mode dev
pnpm --filter mcp-server build   # Build le serveur MCP

# API Keys
pnpm --filter api generate-key <user_id> <name>  # Générer une clé
```

### Architecture

```
┌─────────────────┐
│  Claude Desktop │
│   (MCP Client)  │
└────────┬────────┘
         │ MCP Protocol (stdio)
         ▼
┌─────────────────┐
│   MCP Server    │
│ (Node.js/TS)    │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐      ┌──────────────┐
│   Fastify API   │◄────►│   Supabase   │
│  (TypeScript)   │      │  (PostgreSQL)│
└────────┬────────┘      └──────────────┘
         │
         ▼
┌─────────────────┐
│   ZEP Cloud     │
│  (Semantic      │
│   Memory)       │
└─────────────────┘
```

### Technologies

- **Backend** : Fastify, TypeScript
- **Database** : Supabase (PostgreSQL)
- **Memory** : ZEP Cloud (optionnel)
- **Protocol** : MCP (Model Context Protocol)
- **Package Manager** : pnpm workspaces

## 📖 Documentation

- [BMAD Method Setup](docs/BMAD_SETUP.md) - Framework de développement structuré
- [Database Schema](apps/api/src/db/README.md) - Documentation du schéma de base de données
- [MCP Server](packages/mcp-server/) - Configuration du serveur MCP

## 🐛 Débogage

### L'API ne démarre pas
- Vérifiez que le `.env` est à la racine du projet
- Vérifiez les credentials Supabase
- Vérifiez que le port 3000 est disponible

### Claude Desktop ne voit pas le serveur MCP
- Vérifiez le chemin absolu dans `claude_desktop_config.json`
- Vérifiez que `dist/index.js` existe (après build)
- Redémarrez complètement Claude Desktop
- Vérifiez les logs : `~/Library/Logs/Claude/` (macOS)

### Erreur d'authentification API
- Vérifiez que vous utilisez le bon format : `Bearer mc_...`
- Régénérez une nouvelle clé si nécessaire
- Vérifiez que la clé n'a pas été supprimée

## 🤝 Contribution

Ce projet utilise le **BMAD Method** pour le développement structuré. Voir [docs/BMAD_SETUP.md](docs/BMAD_SETUP.md) pour plus d'informations.

Workflow recommandé :
1. **Analyst** → Définir les besoins
2. **PM** → Prioriser
3. **Architect** → Concevoir
4. **Scrum Master** → Planifier le sprint
5. **Dev** → Implémenter
6. **QA** → Tester

## 📝 License

MIT
