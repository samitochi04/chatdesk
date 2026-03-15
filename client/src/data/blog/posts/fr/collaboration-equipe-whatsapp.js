const post = {
  slug: "collaboration-equipe-whatsapp",
  title: "Comment gérer une équipe sur WhatsApp Business avec ChatDesk",
  excerpt:
    "Découvrez comment ChatDesk permet la collaboration d'équipe sur un seul numéro WhatsApp — attribution des conversations, contrôle des rôles et suivi des performances.",
  author: "amara",
  category: "gettingStarted",
  date: "2026-03-08",
  readTime: 7,
  coverImage:
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
  content: `
## Le défi du WhatsApp Business partagé

La plupart des petites entreprises en Afrique commencent avec un seul téléphone WhatsApp Business. À mesure que l'entreprise grandit, les problèmes apparaissent :

- Une seule personne peut utiliser le téléphone à la fois
- Les messages se perdent quand le téléphone change de mains
- Pas de visibilité sur qui a répondu à quel client
- Pas de moyen de suivre les performances de l'équipe

ChatDesk résout tout cela en connectant votre numéro WhatsApp à un CRM web que **plusieurs membres** peuvent utiliser simultanément.

## Inviter des membres

### Étape 1 : Votre organisation

Quand vous créez un compte ChatDesk, vous devenez automatiquement le **Propriétaire** de votre organisation avec un contrôle total.

### Étape 2 : Inviter

Allez dans **Tableau de bord → Paramètres → Membres** et cliquez sur **Inviter un membre**.

Entrez l'adresse email et assignez un rôle :

- **Admin** — Accès complet incluant la facturation, la gestion d'équipe et les paramètres
- **Agent** — Accès aux conversations, contacts et CRM. Ne peut pas gérer la facturation ou les paramètres

La personne invitée reçoit un email avec un lien pour rejoindre votre espace.

### Étape 3 : Connecter WhatsApp

Un membre de l'équipe scanne le QR code WhatsApp dans **Paramètres → WhatsApp**. Une fois connecté, tous les membres peuvent envoyer et recevoir des messages via le même numéro.

## Contrôle d'accès basé sur les rôles

| Permission | Propriétaire | Admin | Agent |
|---|---|---|---|
| Voir les conversations | ✅ | ✅ | ✅ |
| Envoyer des messages | ✅ | ✅ | ✅ |
| Gérer les contacts | ✅ | ✅ | ✅ |
| Pipeline CRM | ✅ | ✅ | ✅ |
| Réponses rapides | ✅ | ✅ | ✅ |
| Envoi de broadcasts | ✅ | ✅ | ❌ |
| Réponses automatiques | ✅ | ✅ | ❌ |
| Configuration IA | ✅ | ✅ | ❌ |
| Inviter/Supprimer membres | ✅ | ✅ | ❌ |
| Facturation | ✅ | ❌ | ❌ |

## Attribution des conversations

Quand un nouveau message WhatsApp arrive, il apparaît dans la boîte commune. Les membres peuvent :

1. **S'auto-attribuer** — Cliquer sur une conversation non attribuée
2. **Réattribuer** — Transférer une conversation à un collègue
3. **Filtrer** — Voir uniquement ses conversations attribuées

## Notifications en temps réel

ChatDesk informe votre équipe avec des notifications :

- **Nouvelle conversation** — Alerte pour un message non attribué
- **Attribué à vous** — Quand une conversation vous est assignée
- **Mention** — Quand un collègue vous mentionne dans une note

## Tailles d'équipe par plan

| Plan | Membres |
|---|---|
| **Starter** (12 $/mois) | Jusqu'à 3 |
| **Growth** (25 $/mois) | Jusqu'à 10 |
| **Business** (49 $/mois) | Illimité |

## Bonnes pratiques

1. **Définissez la propriété** — Assignez des clients ou régions spécifiques à chaque agent
2. **Utilisez les notes internes** — Laissez du contexte pour le prochain agent
3. **Créez des réponses rapides** — Standardisez les réponses de l'équipe
4. **Configurez les réponses auto** — Gérez les messages hors horaires
5. **Analysez les performances** — Identifiez les points d'amélioration chaque semaine

---

Les fonctionnalités d'équipe sont disponibles sur tous les plans. [Invitez votre équipe](https://chatdesk.org/signup).
  `,
};

export default post;
