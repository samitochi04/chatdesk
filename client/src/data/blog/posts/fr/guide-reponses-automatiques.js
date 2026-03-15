const post = {
  slug: "guide-reponses-automatiques",
  title: "Le guide complet des réponses automatiques sur ChatDesk",
  excerpt:
    "Maîtrisez le système de réponses automatiques ChatDesk : créez des règles par mots-clés, connectez des agents IA, définissez les priorités et automatisez vos réponses WhatsApp.",
  author: "kwame",
  category: "tips",
  date: "2026-03-03",
  readTime: 6,
  coverImage:
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
  content: `
## Ne manquez plus jamais un message client

Vos clients veulent des réponses instantanées. Les études montrent que 82 % des consommateurs s'attendent à une réponse dans les 10 minutes sur les plateformes de messagerie. Le système de réponses automatiques de ChatDesk garantit que chaque message reçoit une réponse immédiate — même quand votre équipe est hors ligne.

## Comment fonctionnent les réponses automatiques

Le principe est simple : quand un message client contient des **mots-clés déclencheurs**, ChatDesk envoie automatiquement une **réponse pré-écrite** — ou déclenche un **agent IA** pour générer une réponse contextuelle.

Le système vérifie les messages entrants par rapport à toutes les règles actives, triées par priorité. La première règle correspondante se déclenche.

## Créer votre première règle

Naviguez vers **Tableau de bord → Réponses auto** et cliquez sur **Créer une règle**.

### Configurer la règle

1. **Nom de la règle** — Un libellé descriptif (ex : "Demande de prix")
2. **Mots-clés déclencheurs** — Mots séparés par des virgules (ex : "prix, tarif, coût, combien, how much")
3. **Texte de réponse** — Le message envoyé quand les mots-clés correspondent :
   \`\`\`
   Merci pour votre intérêt ! Voici nos tarifs :
   
   📦 Starter : 12 $/mois
   🚀 Growth : 25 $/mois
   💼 Business : 49 $/mois
   
   Répondez avec le nom du plan pour plus de détails !
   \`\`\`
4. **Assigner un agent IA** (optionnel) — Laissez l'IA générer une réponse contextuelle
5. **Priorité** — Les numéros plus élevés sont vérifiés en premier
6. **Commutateur actif** — Activez ou désactivez la règle instantanément

## Système de priorité

Quand un message correspond à plusieurs règles, celle avec la **priorité la plus élevée** l'emporte :

| Priorité | Règle | Mots-clés |
|---|---|---|
| **100** | Salutation VIP | "bonjour, salut" (contacts VIP) |
| **50** | Salutation générale | "bonjour, salut, hey" |
| **80** | Tarification | "prix, tarif, combien" |
| **30** | Aide générale | "aide, support, info" |

## Réponse statique vs Agent IA

### Réponse statique
Idéale pour les questions prévisibles :
- Horaires d'ouverture
- Adresse/localisation
- Grille tarifaire
- Liens de suivi de commande

### Réponse par agent IA
Idéale pour les conversations nuancées :
- Recommandations de produits
- Devis personnalisés
- Dépannage technique
- Questions de suivi

## Exemples concrets

### Pour un restaurant
- **Mots-clés** : "menu, nourriture, commander"
- **Réponse** : "🍽️ Voici le menu du jour : [lien]. Pour commander, répondez avec vos plats !"

### Pour une boutique en ligne
- **Mots-clés** : "livraison, expédition, suivi"
- **Réponse** : "📦 La livraison prend 2-5 jours ouvrés au Sénégal. Suivez votre commande ici : [lien]"

### Pour un prestataire de services
- **Mots-clés** : "rendez-vous, réserver, planning"
- **Réponse** : "📅 Prenez rendez-vous ici : [lien]. Créneaux disponibles : Lun-Ven, 9h-17h."

## Bonnes pratiques

1. **Commencez par 3-5 règles** couvrant vos questions les plus fréquentes
2. **Utilisez plusieurs mots-clés par règle** — les clients s'expriment différemment
3. **Gardez des réponses concises** — Moins de 160 caractères pour le meilleur taux de lecture
4. **Incluez un appel à l'action** — "Répondez OUI pour confirmer"
5. **Révisez mensuellement** — Ajoutez de nouveaux mots-clés selon vos observations

---

Les réponses automatiques sont disponibles sur tous les plans ChatDesk. [Commencez maintenant](https://chatdesk.org/signup).
  `,
};

export default post;
