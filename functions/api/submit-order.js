export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Méthode non autorisée." }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = await request.json();
    const customer = body.customer || {};
    const cart = body.cart || {};

    const {
      fullName = customer.fullName,
      phone = customer.phone,
      wilaya = customer.wilaya,
      commune = customer.commune,
      address = customer.address,
      deliveryType = customer.deliveryType || "home",
      color = cart.color || "Noir Profond",
      productName = cart.productName || "Sac Cabas Laila Kiffane",
      productPrice = cart.productPrice || 9000,
      productQty = cart.productQty || 1,
      includeBump = cart.includeBump || false,
      bumpPrice = cart.bumpPrice || 2500,
      upsell = cart.upsell || null,
      downsell = cart.downsell || null,
    } = body;

    if (!fullName || !phone || !wilaya) {
      return new Response(
        JSON.stringify({ error: "Veuillez renseigner votre nom, téléphone et wilaya." }),
        { status: 400, headers: corsHeaders }
      );
    }

    const orderId = body.orderId || ("KFN-" + Math.floor(100000 + Math.random() * 900000));
    const timestamp = body.timestamp || new Date().toISOString();
    const subtotal = productPrice * productQty;
    const bumpTotal = includeBump ? bumpPrice : 0;
    const grandTotal = subtotal + bumpTotal;

    const orderRecord = {
      orderId,
      timestamp,
      customer: { fullName, phone, wilaya, commune: commune || "", address: address || "", deliveryType },
      cart: { productName, color, productPrice, productQty, includeBump, bumpPrice: includeBump ? bumpPrice : 0, upsell, downsell },
      totals: { subtotal, bump: bumpTotal, grandTotal },
      status: "PENDING_CONFIRMATION",
    };

    // 📧 Envoi email via Resend
    if (env?.RESEND_API_KEY) {
      const emailHTML = generateEmailHTML(orderRecord);
      
      try {
        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "onboarding@resend.dev",
            to: "hello@kiffane.com",
            subject: `🛍️ Commande #${orderId}`,
            html: emailHTML,
          }),
        });

        const resendData = await resendResponse.json();
        console.log("Resend:", resendResponse.status, resendData);
      } catch (err) {
        console.error("Resend error:", err.message);
      }
    }

    // 📱 Telegram optionnel
    if (env?.TELEGRAM_BOT_TOKEN && env?.TELEGRAM_CHAT_ID) {
      const msg = `🛍️ *COMMANDE #${orderId}*\n👤 ${fullName}\n📞 ${phone}\n📍 ${wilaya}\n💰 ${grandTotal} DA`;
      try {
        await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: msg, parse_mode: "Markdown" }),
        });
      } catch (err) {
        console.error("Telegram error:", err.message);
      }
    }

    return new Response(JSON.stringify({ success: true, orderId, message: "Commande enregistrée", order: orderRecord }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Server error:", error);
    return new Response(JSON.stringify({ error: error.message || "Erreur serveur" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

function generateEmailHTML(order) {
  const { orderId, timestamp, customer, cart, totals } = order;
  const date = new Date(timestamp).toLocaleString("fr-FR", { timeZone: "Africa/Algiers" });

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><style>
body{font-family:Arial;color:#333;margin:0;padding:0;background:#f5f5f5}
.container{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)}
.header{background:linear-gradient(135deg,#1a1a1a,#333);color:#fff;padding:30px 20px;text-align:center}
.header h1{margin:0;font-size:28px}
.content{padding:30px 20px}
.order-id{background:#f9f9f9;padding:15px;border-left:4px solid #d4af37;margin-bottom:20px;border-radius:4px}
.order-id strong{display:block;color:#d4af37;font-size:12px;margin-bottom:5px}
.order-id p{margin:0;font-size:20px;font-weight:bold;color:#1a1a1a}
.section{margin-bottom:25px}
.section-title{font-size:16px;font-weight:bold;color:#1a1a1a;margin-bottom:12px;border-bottom:2px solid #f0f0f0;padding-bottom:8px}
.info-row{display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px}
.info-label{font-weight:bold;color:#666}
.info-value{color:#333}
.product-box{background:#fafafa;padding:15px;border-radius:4px;margin-bottom:10px}
.product-name{font-weight:bold;color:#1a1a1a;margin-bottom:8px}
.totals{background:#f9f9f9;padding:15px;border-radius:4px}
.total-row{display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px}
.total-row.grand-total{font-size:18px;font-weight:bold;color:#d4af37;border-top:2px solid #ddd;padding-top:10px;margin-top:10px}
.footer{background:#f5f5f5;padding:20px;text-align:center;border-top:1px solid #eee;font-size:12px;color:#888}
</style></head><body><div class="container"><div class="header"><h1>🛍️ Commande Reçue</h1><p>Kiffane.com</p></div><div class="content"><div class="order-id"><strong>RÉFÉRENCE</strong><p>${orderId}</p></div><div class="section"><div class="section-title">📋 Client</div><div class="info-row"><span class="info-label">Nom:</span><span class="info-value">${customer.fullName}</span></div><div class="info-row"><span class="info-label">Téléphone:</span><span class="info-value">${customer.phone}</span></div><div class="info-row"><span class="info-label">Wilaya:</span><span class="info-value">${customer.wilaya}</span></div><div class="info-row"><span class="info-label">Livraison:</span><span class="info-value">${customer.deliveryType === "desk" ? "Desk Yalidine" : "À Domicile"}</span></div></div><div class="section"><div class="section-title">🛒 Produit</div><div class="product-box"><div class="product-name">📦 ${cart.productName}</div><div class="info-row"><span>Couleur:</span><span>${cart.color}</span></div><div class="info-row"><span>Quantité:</span><span>${cart.productQty}</span></div><div class="info-row"><span>Prix:</span><span>${cart.productPrice.toLocaleString("fr-FR")} DA</span></div></div>${cart.includeBump ? `<div class="product-box"><div class="product-name">👛 Portefeuille Bonus</div><div class="info-row"><span>Prix:</span><span>${cart.bumpPrice.toLocaleString("fr-FR")} DA</span></div></div>` : ""}</div><div class="section"><div class="totals"><div class="total-row"><span>Sous-total:</span><span>${totals.subtotal.toLocaleString("fr-FR")} DA</span></div>${totals.bump > 0 ? `<div class="total-row"><span>Bonus:</span><span>+${totals.bump.toLocaleString("fr-FR")} DA</span></div>` : ""}<div class="total-row grand-total"><span>💰 TOTAL:</span><span>${totals.grandTotal.toLocaleString("fr-FR")} DA</span></div></div></div><div class="info-row"><span class="info-label">Date:</span><span class="info-value">${date}</span></div></div><div class="footer"><p>Email généré par Kiffane.com</p><p>hello@kiffane.com</p></div></div></body></html>`;
}
