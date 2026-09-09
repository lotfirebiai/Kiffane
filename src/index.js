export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Route /api/submit-order
    if (url.pathname === "/api/submit-order" && request.method === "POST") {
      try {
        const data = await request.json();
        
        // Validate structure
        if (!data.customer || !data.cart) {
          return new Response(JSON.stringify({ error: "Invalid data structure" }), { 
            status: 400, 
            headers: { "Content-Type": "application/json" } 
          });
        }
        
        const { customer, cart } = data;
        const orderId = 'ORD-' + Date.now();
        const orderDate = new Date().toISOString().split('T')[0];
        
        // Calculate
        const subtotal = cart.price * cart.qty;
        const bumpTotal = cart.includeBump ? cart.bumpPrice : 0;
        const grandTotal = subtotal + bumpTotal;
        
        // Build email
        const emailBody = `
          <h2>Nouvelle Commande: ${orderId}</h2>
          <p><strong>Client:</strong> ${customer.name}</p>
          <p><strong>Téléphone:</strong> ${customer.phone}</p>
          <p><strong>Adresse:</strong> ${customer.address}, ${customer.commune}, ${customer.wilaya}</p>
          <p><strong>Type de livraison:</strong> ${customer.deliveryType}</p>
          <hr>
          <p><strong>Produit:</strong> ${cart.productName} (${cart.color})</p>
          <p><strong>Prix:</strong> ${cart.price} DA × ${cart.qty}</p>
          <p><strong>Sous-total:</strong> ${subtotal} DA</p>
          ${bumpTotal > 0 ? `<p><strong>Bump:</strong> ${bumpTotal} DA</p>` : ''}
          <p><strong style="font-size: 18px;">TOTAL: ${grandTotal} DA</strong></p>
        `;
        
        // SYNCHRONE: Attendre que l'email soit envoyé
        let emailId = null;
        let emailError = null;
        
        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${env.RESEND_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: 'noreply@kiffane.com',
              to: env.ZOHO_EMAIL,
              subject: `Nouvelle commande: ${orderId}`,
              html: emailBody
            })
          });
          
          const emailData = await emailResponse.json();
          emailId = emailData.id;
          
          if (!emailResponse.ok) {
            emailError = emailData.message || 'Email send failed';
          }
        } catch (err) {
          emailError = err.message;
        }
        
        // Return response (email has already been sent!)
        return new Response(JSON.stringify({
          success: true,
          order: { orderId, orderDate, customer, cart, totals: { subtotal, bumpTotal, grandTotal } },
          email: { id: emailId, error: emailError }
        }), {
          headers: { "Content-Type": "application/json" },
          status: 200
        });
        
      } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    
    return new Response("Not Found", { status: 404 });
  }
};
