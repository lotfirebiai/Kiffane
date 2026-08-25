# Spécifications du Projet - Kiffane.com

## 1. Vue d'ensemble de la Marque & du Produit
- **Nom de domaine :** `kiffane.com`
- **Marque :** Kiffane (Maroquinerie de luxe accessible en cuir véritable).
- **Produit Principal :** **Sac Cabas Laila Kiffane de taille moyenne en cuir véritable** (Inspiré des lignes intemporelles de maroquinerie haut de gamme).
  - **Matière :** 100% Cuir véritable grainé résistant aux rayures, finitions métalliques dorées polies, pieds métalliques de protection.
  - **Coloris :** Noir Profond, Beige Taupe, Blanc Crème.
  - **Prix de vente :** 9 000 DA *(Prix barré : 11 500 DA, -22% de remise de lancement)*.
- **Public Cible :** Femmes actives algériennes (22-45 ans), universités, milieu professionnel, sur les 58 Wilayas (Alger, Oran, Sétif, Constantine, Annaba, etc.).
- **Fournisseur / Sourcing :** Opal'o Logistique (Sourcing Chine & approvisionnement).
- **Partenaires Logistiques :** Yalidine Express & eDelivery Express (Livraison à domicile & Stop Desk 58 Wilayas).
- **Service Client & WhatsApp :** `+213 772 84 79 46`

---

## 2. Architecture du Tunnel de Vente (Funnel)

```
[ 1. Landing Page Mono-Produit ]
  • Sélecteur dynamique de couleur (Noir / Beige / Crème)
  • Formulaire COD 58 Wilayas (Domicile / Stop Desk)
  • ORDER BUMP : Portefeuille en cuir assorti (+2 500 DA au lieu de 4 500 DA)
       │
       ▼
[ Soumission du Formulaire COD ] ──► API /functions/api/submit-order.js
       │
       ▼
[ 2. Page UPSELL (Post-Achat) ]
  • Offre : Kit de Soin & Baume Nourrissant Cuir + Chiffon microfibre (+1 200 DA au lieu de 2 500 DA)
  • Frais de port supplémentaires : 0 DA
       │
       ├─► [ Accepte ] ────────────────────────┐
       │                                       │
       ▼ (Refuse)                              │
[ 3. Page DOWNSELL (Repli) ]                   │
  • Offre : Porte-clés & Bijou de sac en cuir (+800 DA au lieu de 1 500 DA)
  • Frais de port supplémentaires : 0 DA      │
       │                                       │
       ├─► [ Accepte ou Refuse ]               │
       │                                       │
       ▼                                       ▼
[ 4. Page MERCI / Confirmation ] ◄─────────────┘
  • Récapitulatif dynamique complet (Produits + Wilaya + Frais de livraison + Total en DA)
  • Réassurance forte : Notification d'appel du service client avant expédition
  • Bouton direct WhatsApp vers +213 772 84 79 46
```

---

## 3. Stack Technique & Fichiers du Projet

- **Frontend :** HTML5, Tailwind CSS, JavaScript Vanilla ultra-léger (zéro framework lourd, temps de chargement < 1s).
- **Assets Visuels :** `public/assets/`
  - `sac-noir.jpg` : Visuel studio haute résolution du sac en cuir noir.
  - `sac-beige.jpg` : Visuel studio du sac en cuir beige taupe.
  - `sac-creme.jpg` : Visuel studio du sac en cuir blanc crème.
  - `portefeuille.jpg` : Visuel studio du portefeuille compagnon (Order Bump).
  - `kit-soin.jpg` : Visuel studio du kit baume nourrissant cuir (Upsell).
  - `porte-cles.jpg` : Visuel studio du porte-clés & bijou de sac (Downsell).
- **Base Wilayas :** `public/js/wilayas.js` (58 Wilayas avec tarifs Stop Desk & Domicile).
- **Backend Serverless :** `functions/api/submit-order.js` (Cloudflare Pages Functions).
- **Déploiement :** Cloudflare Pages connecté au dépôt GitHub `lotfirebiai/Kiffane`.
