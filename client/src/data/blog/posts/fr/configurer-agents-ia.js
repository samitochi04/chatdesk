const post = {
  slug: "configurer-agents-ia",
  title: "Comment configurer les agents IA sur ChatDesk pour WhatsApp",
  excerpt:
    "Guide complet pour créer et personnaliser vos agents IA ChatDesk — réponses automatiques intelligentes, instructions personnalisées et gestion de la durée de contexte.",
  author: "amara",
  category: "gettingStarted",
  date: "2026-03-01",
  readTime: 8,
  coverImage:
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
  content: `
## L'intelligence artificielle au service de vos clients

Imaginez un assistant qui connaît parfaitement vos produits, répond instantanément, et ne dort jamais. C'est exactement ce que les agents IA de ChatDesk offrent à votre entreprise.

## Qu'est-ce qu'un agent IA ChatDesk ?

Un agent IA est un assistant virtuel alimenté par l'intelligence artificielle (GPT) qui peut :

- **Répondre aux questions** des clients sur vos produits et services
- **Suivre des instructions** spécifiques que vous définissez
- **Maintenir le contexte** de la conversation sur plusieurs messages
- **Répondre en plusieurs langues** — français, anglais, et plus

## Créer votre premier agent IA

Naviguez vers **Tableau de bord → Agents IA** et cliquez sur **Créer un agent**.

### Étape 1 : Informations de base

- **Nom de l'agent** — Ex : "Assistant Boutique Awa"
- **Description** — Ce que fait cet agent

### Étape 2 : Instructions personnalisées

C'est la partie la plus importante. Rédigez des instructions claires :

\`\`\`
Tu es l'assistant virtuel de la Boutique Awa, une boutique de mode africaine basée à Dakar.

Tes responsabilités :
- Répondre aux questions sur nos produits (robes, boubous, accessoires)
- Donner les prix (robes à partir de 15 000 FCFA, boubous à partir de 25 000 FCFA)
- Informer sur les délais de livraison (2-3 jours à Dakar, 5-7 jours en région)
- Prendre les commandes en notant : article, taille, couleur, adresse de livraison

Règles :
- Toujours répondre en français
- Être poli et professionnel
- Ne jamais inventer d'information que tu ne connais pas
- Pour les questions complexes, dire : "Je transfère votre demande à un conseiller"
\`\`\`

### Étape 3 : Durée de contexte

Définissez combien de temps l'agent garde le contexte de la conversation :
- **30 minutes** — Pour les interactions courtes (questions simples)
- **2 heures** — Pour les processus de vente
- **24 heures** — Pour les suivis complexes

### Étape 4 : Activer l'agent

Basculez le commutateur pour activer votre agent. Il peut être :
- **Déclenché par une règle auto-réponse** — Un mot-clé active l'agent
- **Assigné comme répondeur par défaut** — L'agent répond à tous les messages non traités

## Connecter un agent IA aux règles auto-réponse

Pour qu'un agent IA se déclenche automatiquement :

1. Allez dans **Réponses auto**
2. Créez ou modifiez une règle
3. Dans le champ **Agent IA**, sélectionnez votre agent
4. Quand le mot-clé est détecté, l'agent IA répond au lieu du texte statique

## Exemples d'agents IA par secteur

### E-commerce
\`\`\`
Agent : Assistant Shopping
Instructions : Connaître le catalogue, recommander des produits,
              calculer les frais de livraison, guider le processus de commande
\`\`\`

### Santé
\`\`\`
Agent : Assistant Clinique
Instructions : Informer sur les services, horaires, tarifs,
              prendre des rendez-vous, rappeler de ne pas donner
              de diagnostic médical
\`\`\`

### Immobilier
\`\`\`
Agent : Assistant Immobilier
Instructions : Présenter les biens disponibles, organiser les visites,
              qualifier les prospects (budget, localisation souhaitée)
\`\`\`

### Éducation
\`\`\`
Agent : Assistant Formation
Instructions : Informer sur les programmes, tarifs, dates de rentrée,
              processus d'inscription, documents requis
\`\`\`

## Bonnes pratiques

1. **Soyez précis** — Plus vos instructions sont détaillées, meilleures sont les réponses
2. **Définissez les limites** — Indiquez clairement ce que l'agent ne doit PAS faire
3. **Testez avant de déployer** — Discutez avec votre agent pour vérifier ses réponses
4. **Incluez les prix** — Les clients demandent presque toujours les tarifs
5. **Prévoyez l'escalade** — L'agent doit savoir quand transférer à un humain
6. **Mettez à jour régulièrement** — Les informations changent, vos instructions aussi

## Disponibilité par plan

| Fonctionnalité | Starter | Growth | Business |
|---|---|---|---|
| Agents IA | ❌ | ✅ | ✅ |
| Instructions personnalisées | ❌ | ✅ | ✅ |
| Agents multiples | ❌ | ✅ | ✅ |
| Contexte étendu | ❌ | ❌ | ✅ |

---

Les agents IA sont disponibles à partir du plan Growth. [Essayez maintenant](https://chatdesk.org/signup).
  `,
};

export default post;
