import gettingStarted from "./posts/en/getting-started";
import whatsappTips from "./posts/en/whatsapp-tips";
import aiCustomerService from "./posts/en/ai-customer-service";
import broadcastCampaigns from "./posts/en/broadcast-campaigns";
import premiersPas from "./posts/fr/premiers-pas";
import astucesWhatsapp from "./posts/fr/astuces-whatsapp";
import iaServiceClient from "./posts/fr/ia-service-client";
import campagnesDiffusion from "./posts/fr/campagnes-diffusion";
import authors from "./authors";

const posts = {
  en: [gettingStarted, whatsappTips, aiCustomerService, broadcastCampaigns],
  fr: [premiersPas, astucesWhatsapp, iaServiceClient, campagnesDiffusion],
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
