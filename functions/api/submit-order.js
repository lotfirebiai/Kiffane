/**
 * Cloudflare Pages Function : /api/submit-order
 * Réception et traitement des commandes COD (Cash On Delivery)
 */
export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();

    const {
      fullName,
      phone,
      wilaya,
      commune,
      address,
      deliveryType = "home", // "home" ou "desk"
      productQty = 1,
      includeBump = false,
      upsell = null,
      downsell = null,
    } = body;

    // Validation minimale
    if (!fullName || !phone || !wilaya) {
      return new Response(
        JSON.stringify({ error: "Veuillez renseigner votre nom, téléphone et wilaya." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Génération référence commande
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
        productQty,
        includeBump,
        upsell,
        downsell,
      },
      status: "PENDING_CONFIRMATION", // En attente d'appel client
    };

    // Optionnel : Envoi webhook Telegram / Google Sheets si configuré dans Cloudflare env
    if (env && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
      const message = `🛍️ *Nouvelle commande COD #${orderId}*\n\n` +
        `👤 *Client :* ${fullName}\n` +
        `📞 *Tél :* ${phone}\n` +
        `📍 *Wilaya :* ${wilaya} (${deliveryType === "desk" ? "Stop Desk" : "À domicile"})\n` +
        `📦 *Qté :* ${productQty} | *Bump :* ${includeBump ? "OUI" : "NON"}\n` +
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
        message: "Commande enregistrée avec succès",
        order: orderRecord,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
