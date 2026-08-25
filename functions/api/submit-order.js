/**
 * Cloudflare Pages Function : /api/submit-order
 * Réception et traitement des commandes COD (Cash On Delivery) pour Kiffane.com
 */
export async function onRequest(context) {
  const { request, env } = context;

  // Headers CORS pour autoriser tout appel
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // Pré-vol CORS
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Méthode non autorisée. Utilisez POST." }), {
      status: 405,
      headers: corsHeaders,
    });
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

    // Validation minimale
    if (!fullName || !phone || !wilaya) {
      return new Response(
        JSON.stringify({ error: "Veuillez renseigner votre nom, numéro de téléphone et wilaya." }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Génération référence commande unique
    const orderId = "KFN-" + Math.floor(100000 + Math.random() * 900000);
    const timestamp = new Date().toISOString();

    const orderRecord = {
      orderId,
      timestamp,
      customer: {
        fullName,
        phone,
        wilaya,
        commune: commune || "",
        address: address || "",
        deliveryType,
      },
      cart: {
        productName,
        color,
        productPrice,
        productQty,
        includeBump,
        bumpPrice: includeBump ? bumpPrice : 0,
        upsell,
        downsell,
      },
      status: "PENDING_CONFIRMATION",
    };

    // Optionnel : Envoi notification Telegram si configuré dans Cloudflare Environment Variables
    if (env && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
      const message = `🛍️ *NOUVELLE COMMANDE KIFFANE #${orderId}*\n\n` +
        `👤 *Client :* ${fullName}\n` +
        `📞 *Téléphone :* ${phone}\n` +
        `📍 *Destination :* ${wilaya} (${deliveryType === "desk" ? "Stop Desk Yalidine" : "À Domicile"})\n` +
        `👜 *Sac :* ${productName} - *${color}*\n` +
        `👛 *Portefeuille (Order Bump) :* ${includeBump ? "OUI (+2500 DA)" : "NON"}\n` +
        `⏰ *Date :* ${new Date().toLocaleString("fr-FR", { timeZone: "Africa/Algiers" })}`;

      try {
        await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: env.TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: "Markdown",
          }),
        });
      } catch (err) {
        console.error("Erreur notification Telegram:", err);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        message: "Commande Kiffane enregistrée avec succès",
        order: orderRecord,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Erreur interne du serveur" }),
      { status: 500, headers: corsHeaders }
    );
  }
}
