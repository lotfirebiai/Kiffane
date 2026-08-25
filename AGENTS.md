# Spécifications du Projet - Kiffane.com

## 1. Vue d'ensemble du Projet
- **Nom de domaine :** `kiffane.com`
- **Modèle économique :** E-commerce Mono-produit en **Paiement à la Livraison (COD - Cash On Delivery)** ciblant l'Algérie (58 Wilayas).
- **Hébergement & Infrastructure :** Cloudflare Pages (Statique + Serverless Pages Functions).
- **Fournisseur / Sourcing :** Opal'o Logistique (Sourcing Chine & approvisionnement).
- **Partenaires Logistiques / Livraison :** Yalidine Express / eDelivery Express.

---

## 2. Architecture du Tunnel de Vente (Funnel)

```
[ Landing Page Mono-Produit ] 
       │ (Avec Order Bump dans le formulaire COD)
       ▼
[ Soumission du Formulaire COD ] ── (Création du lead / commande)
       │
       ▼
[ Page UPSELL ] ─────────── (Accepte : ajout au panier) ──► [ Page MERCI ]
       │ (Refuse)
       ▼
[ Page DOWNSELL ] ───────── (Accepte ou Refuse) ──────────► [ Page MERCI ]
```

### Pages du Funnel :
1. **`public/index.html` (Landing Page)** :
   - Présentation persuasive du produit principal (Accroche, Problème/Solution, Démonstrations, Avis clients).
   - Formulaire de commande COD optimisé conversion :
     - Nom complet, Téléphone (validation indicatifs 05/06/07), Wilaya (58 wilayas), Commune, Adresse.
     - Mode de livraison : À domicile ou Stop Desk (bureau Yalidine).
     - **Order Bump** : Case à cocher pour ajouter un produit accessoire / pack complémentaire à prix préférentiel.
2. **`public/upsell.html` (Offre Upsell Post-Achat)** :
   - Offre irrésistible présentée après validation initiale.
   - Ajout en un clic à la commande en cours sans ressaisie des coordonnées.
3. **`public/downsell.html` (Offre Downsell de repli)** :
   - Alternative plus abordable si le client décline l'Upsell.
4. **`public/merci.html` (Confirmation de Commande)** :
   - Récapitulatif clair de la commande (Produits + Frais de livraison + Total TTC en DZD).
   - Message de réassurance : confirmation téléphonique avant expédition.
   - Bouton de contact direct WhatsApp.

---

## 3. Stack Technique & Directives de Développement

- **Frontend :** HTML5 sémantique, Tailwind CSS (via CDN ou build léger), JavaScript Vanilla (sans framework lourd pour un temps de chargement instantané < 1s).
- **Backend / API :** Cloudflare Pages Functions (`/functions/api/submit-order.js`).
- **Gestion des Wilayas :** `public/js/wilayas.js` (Liste complète des 58 Wilayas algériennes avec tarifs Stop Desk / Domicile).
- **Intégrations futures :** 
  - Webhooks vers Google Sheets / Notion / Telegram Bot pour notification en direct de l'équipe d'appels de confirmation.
  - Connexion API Yalidine / eDelivery pour génération automatique des bordereaux d'expédition.

---

## 4. Règles de Conception & Conversion
- **Mobile First :** +85% du trafic e-commerce COD provient des smartphones (Instagram / TikTok / Facebook Ads).
- **Clarté des Prix :** Affichage systématique en Dinars Algériens (**DZD** / **DA**).
- **Réassurance continue :** Badges "Paiement à la livraison", "Garantie échange 100%", "Livraison rapide 58 Wilayas".
