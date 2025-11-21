
// Vercel serverless function to create a Cashfree order
// Reads credentials from environment variables for safety:
//   CASHFREE_APP_ID
//   CASHFREE_SECRET_KEY

module.exports = async (req, res) => {
  // Basic CORS so you can call this from your frontend on the same domain
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const APP_ID = process.env.CASHFREE_APP_ID;
  const SECRET = process.env.CASHFREE_SECRET_KEY;

  if (!APP_ID || !SECRET) {
    res.status(500).json({ error: "Cashfree credentials not set on server" });
    return;
  }

  try {
    const amount = 209; // fixed product price in INR
    const customer_name = "Buyer";
    const customer_phone = "9999999999";

    const orderData = {
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: "cust_" + Date.now(),
        customer_name,
        customer_phone,
      },
      order_meta: {
        // After payment, Cashfree will redirect user here:
        return_url: "https://bookmintor.shop/payment-status.html?order_id={order_id}&txStatus={order_status}",
      },
    };

    const cfRes = await fetch("https://api.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "x-client-id": APP_ID,
        "x-client-secret": SECRET,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    const data = await cfRes.json();

    if (!cfRes.ok) {
      console.error("Cashfree error:", data);
      res.status(cfRes.status).json({ error: "Cashfree API error", details: data });
      return;
    }

    res.status(200).json({ paymentSessionId: data.payment_session_id });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

