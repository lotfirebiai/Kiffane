/**
 * Cloudflare Worker pour Kiffane.com
 * Routage API backend : Réception des commandes COD + Envoi instantané Telegram (HTML) & Google Sheets
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // 1. Gestion Pré-vol CORS
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // 2. Route API : /api/submit-order
    if (url.pathname === "/api/submit-order") {
      if (request.method !== "POST") {
        return new Response(
          JSON.stringify({ error: "Méthode non autorisée. Utilisez POST." }),
          { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        const body = await request.json();
        const {
          fullName,
          phone,
          wilaya,
          commune,
          address,
          deliveryType = "home",
          color = "Noir Profond",
          productName = "Sac Cabas Laila Kiffane (Cuir Véritable)",
          productPrice = 9000,
          productQty = 1,
          includeBump = false,
          bumpPrice = 2500,
          upsell = null,
          downsell = null,
        } = body;

        // Validation
        if (!fullName || !phone || !wilaya) {
          return new Response(
            JSON.stringify({ error: "Veuillez renseigner votre nom, numéro de téléphone et wilaya." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const orderId = body.orderId || ("KFN-" + Math.floor(100000 + Math.random() * 900000));
        const timestamp = new Date().toISOString();

        const orderRecord = {
          orderId,
          timestamp,
          dateFormatted: new Date().toLocaleString("fr-FR", { timeZone: "Africa/Algiers" }),
          customer: {
            fullName,
            phone,
            wilaya,
            commune: commune || "",
            address: address || "",
            deliveryType: deliveryType === "desk" ? "Stop Desk (Bureau Yalidine)" : "À Domicile",
          },
          cart: {
            productName,
            color,
            productPrice,
            productQty,
            includeBump,
            bumpName: includeBump ? "Portefeuille en Cuir Assorti (+2 500 DA)" : "Aucun",
            bumpPrice: includeBump ? bumpPrice : 0,
            upsell,
            downsell,
          },
          status: "À CONFIRMER (Appel téléphonique)",
        };

        const backgroundTasks = [];

        // 📲 1. Notification Telegram en format HTML (ultra-robuste, ne plante jamais)
        if (env && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
          const telegramHtml = 
            `🛍️ <b>NOUVELLE COMMANDE KIFFANE #${orderId}</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `👤 <b>Client :</b> ${escapeHtml(fullName)}\n` +
            `📞 <b>Téléphone :</b> <code>${escapeHtml(phone)}</code>\n` +
            `📍 <b>Destination :</b> ${escapeHtml(wilaya)} - ${escapeHtml(commune || '')}\n` +
            `🚚 <b>Mode :</b> ${deliveryType === "desk" ? "Bureau Yalidine (Stop Desk)" : "Livraison Domicile"}\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `👜 <b>Sac :</b> Cabas Laila (${escapeHtml(color)}) - 9 000 DA\n` +
            `👛 <b>Portefeuille (Bump) :</b> ${includeBump ? "✅ OUI (+2 500 DA)" : "❌ NON"}\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `⏰ <b>Date :</b> ${orderRecord.dateFormatted}`;

          backgroundTasks.push(
            (async () => {
              try {
                const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    chat_id: env.TELEGRAM_CHAT_ID,
                    text: telegramHtml,
                    parse_mode: "HTML",
                    disable_web_page_preview: true,
                  }),
                });
                const resJson = await res.json();
                console.log("Résultat Telegram API:", JSON.stringify(resJson));
                if (!resJson.ok) {
                  console.error("Erreur Telegram API détail:", resJson.description);
                }
              } catch (e) {
                console.error("Exception envoi Telegram:", e);
              }
            })()
          );
        } else {
          console.warn("Variables TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID manquantes dans Cloudflare.");
        }

        // 📊 2. Synchronisation Google Sheets
        if (env && env.GOOGLE_SHEETS_WEBHOOK_URL) {
          backgroundTasks.push(
            (async () => {
              try {
                const res = await fetch(env.GOOGLE_SHEETS_WEBHOOK_URL, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(orderRecord),
                });
                console.log("Résultat Google Sheets status:", res.status);
              } catch (e) {
                console.error("Exception Google Sheets:", e);
              }
            })()
          );
        }

        // Exécution en arrière-plan sans ralentir le client
        if (ctx && ctx.waitUntil && backgroundTasks.length > 0) {
          ctx.waitUntil(Promise.allSettled(backgroundTasks));
        }

        return new Response(
          JSON.stringify({
            success: true,
            orderId,
            message: "Commande enregistrée avec succès",
            order: orderRecord,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ error: err.message || "Erreur interne" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 3. Distribution des fichiers statiques (Landing, Images, Scripts)
    if (env && env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Kiffane Worker actif.", { status: 200 });
  },
};

// Helper pour échapper les caractères spéciaux HTML
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
