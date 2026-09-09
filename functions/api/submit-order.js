export async function onRequest(context) {
  const { request } = context;
  
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const data = await request.json();
    
    // Generate Order ID
    const orderId = 'ORD-' + Date.now();
    const orderDate = new Date().toISOString().split('T')[0];
    
    // Calculate totals
    const subtotal = data.cart.price * data.cart.qty;
    const bumpTotal = data.cart.includeBump ? data.cart.bumpPrice : 0;
    const grandTotal = subtotal + bumpTotal;
    
    // Send email via Resend (THIS WORKS!)
    const emailBody = `
      <h2>Nouvelle Commande: ${orderId}</h2>
      <p><strong>Client:</strong> ${data.customer.name}</p>
      <p><strong>Téléphone:</strong> ${data.customer.phone}</p>
      <p><strong>Adresse:</strong> ${data.customer.address}, ${data.customer.commune}, ${data.customer.wilaya}</p>
      <p><strong>Type de livraison:</strong> ${data.customer.deliveryType}</p>
      <hr>
      <p><strong>Produit:</strong> ${data.cart.productName} (${data.cart.color})</p>
      <p><strong>Prix:</strong> ${data.cart.price} DA × ${data.cart.qty}</p>
      <p><strong>Sous-total:</strong> ${subtotal} DA</p>
      ${bumpTotal > 0 ? `<p><strong>Bump:</strong> ${bumpTotal} DA</p>` : ''}
      <p><strong style="font-size: 18px;">TOTAL: ${grandTotal} DA</strong></p>
      <p style="color: gray; font-size: 12px;">Date: ${orderDate}</p>
    `;
    
    try {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${context.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'noreply@kiffane.com',
          to: context.env.ZOHO_EMAIL,
          subject: `Nouvelle commande: ${orderId}`,
          html: emailBody
        })
      });
      
      console.log('✅ Email sent:', emailResponse.status, orderId);
    } catch (emailError) {
      console.error('❌ Email error:', emailError);
    }
    
    // Return success JSON
    return new Response(JSON.stringify({
      success: true,
      order: {
        orderId,
        orderDate,
        customer: data.customer,
        cart: data.cart,
        totals: { subtotal, bumpTotal, grandTotal }
      }
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
