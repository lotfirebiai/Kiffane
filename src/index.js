export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname === "/api/submit-order" && request.method === "POST") {
      try {
        const data = await request.json();
        
        if (!data.customer || !data.cart) {
          return new Response(JSON.stringify({ error: "Invalid data structure" }), { 
            status: 400, 
            headers: { "Content-Type": "application/json" } 
          });
        }
        
        const { customer, cart } = data;
        const orderId = 'ORD-' + Date.now();
        const orderDate = new Date().toISOString().split('T')[0];
        
        const subtotal = cart.price * cart.qty;
        const bumpTotal = cart.includeBump ? cart.bumpPrice : 0;
        const grandTotal = subtotal + bumpTotal;
        
        return new Response(JSON.stringify({
          success: true,
          order: { orderId, orderDate, customer, cart, totals: { subtotal, bumpTotal, grandTotal } }
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
