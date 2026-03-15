import gettingStarted from "./posts/en/getting-started";
import whatsappTips from "./posts/en/whatsapp-tips";
import aiCustomerService from "./posts/en/ai-customer-service";
import broadcastCampaigns from "./posts/en/broadcast-campaigns";
import managingConversations from "./posts/en/managing-whatsapp-conversations";
import buildingCustomerDatabase from "./posts/en/building-customer-database";
import salesPipeline from "./posts/en/sales-pipeline-management";
import settingUpAiAgents from "./posts/en/setting-up-ai-agents";
import autoReplyRules from "./posts/en/auto-reply-rules-guide";
import quickReplies from "./posts/en/quick-replies-faster-responses";
import teamCollaboration from "./posts/en/team-collaboration-whatsapp";
import crmAnalytics from "./posts/en/whatsapp-crm-analytics";
import whyAfricanBusinesses from "./posts/en/why-african-businesses-need-whatsapp-crm";
import chatdeskVsManual from "./posts/en/chatdesk-vs-manual-whatsapp";
import premiersPas from "./posts/fr/premiers-pas";
import astucesWhatsapp from "./posts/fr/astuces-whatsapp";
import iaServiceClient from "./posts/fr/ia-service-client";
import campagnesDiffusion from "./posts/fr/campagnes-diffusion";
import gestionConversations from "./posts/fr/gestion-conversations-whatsapp";
import baseDonneesClients from "./posts/fr/construire-base-donnees-clients";
import pipelineVentes from "./posts/fr/gestion-pipeline-ventes";
import configurerAgentsIa from "./posts/fr/configurer-agents-ia";
import reponsesAutomatiques from "./posts/fr/guide-reponses-automatiques";
import reponsesRapides from "./posts/fr/reponses-rapides-whatsapp";
import collaborationEquipe from "./posts/fr/collaboration-equipe-whatsapp";
import analytiquesCrm from "./posts/fr/analytiques-crm-whatsapp";
import pourquoiEntreprisesAfricaines from "./posts/fr/pourquoi-entreprises-africaines-crm-whatsapp";
import chatdeskVsManuel from "./posts/fr/chatdesk-vs-whatsapp-manuel";
import authors from "./authors";

const posts = {
  en: [
    gettingStarted,
    whatsappTips,
    aiCustomerService,
    broadcastCampaigns,
    managingConversations,
    buildingCustomerDatabase,
    salesPipeline,
    settingUpAiAgents,
    autoReplyRules,
    quickReplies,
    teamCollaboration,
    crmAnalytics,
    whyAfricanBusinesses,
    chatdeskVsManual,
  ],
  fr: [
    premiersPas,
    astucesWhatsapp,
    iaServiceClient,
    campagnesDiffusion,
    gestionConversations,
    baseDonneesClients,
    pipelineVentes,
    configurerAgentsIa,
    reponsesAutomatiques,
    reponsesRapides,
    collaborationEquipe,
    analytiquesCrm,
    pourquoiEntreprisesAfricaines,
    chatdeskVsManuel,
  ],
};

export function getPosts(lang = "en") {
  return (posts[lang] || posts.en).sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );
}

export function getPost(slug, lang = "en") {
  return (posts[lang] || posts.en).find((p) => p.slug === slug) || null;
}

export function getAuthor(id) {
  return authors[id] || null;
}

export function getRelatedPosts(slug, category, lang = "en", limit = 3) {
  return (posts[lang] || posts.en)
    .filter((p) => p.slug !== slug && p.category === category)
    .slice(0, limit);
}

export { default as authors } from "./authors";
export { default as categories } from "./categories";
