// redeploy
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const allowedOrigin = "https://nthagafi1403-gif.github.io";

    const corsHeaders = {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    if (request.method !== "GET") {
      return json(
        { ok: false, error: "Method not allowed" },
        405,
        corsHeaders
      );
    }

    if (url.pathname !== "/verify-payment") {
      return json(
        { ok: false, error: "Not found" },
        404,
        corsHeaders
      );
    }

    const paymentId = url.searchParams.get("id");

    if (!paymentId) {
      return json(
        { ok: false, error: "Missing payment id" },
        400,
        corsHeaders
      );
    }

    if (!env.MOYASAR_SECRET_KEY) {
      return json(
        { ok: false, error: "Server is not configured" },
        500,
        corsHeaders
      );
    }

    try {
      const auth = btoa(`${env.MOYASAR_SECRET_KEY}:`);

      const response = await fetch(
        `https://api.moyasar.com/v1/payments/${encodeURIComponent(paymentId)}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Basic ${auth}`,
            "Accept": "application/json"
          }
        }
      );

      const payment = await response.json();

      if (!response.ok) {
        return json(
          {
            ok: false,
            verified: false,
            error: "Unable to verify payment"
          },
          502,
          corsHeaders
        );
      }

      const verified =
        payment.status === "paid" &&
        payment.amount === 500 &&
        payment.currency === "SAR";

      return json(
        {
          ok: true,
          verified,
          payment_id: payment.id,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency
        },
        200,
        corsHeaders
      );
    } catch (error) {
      return json(
        {
          ok: false,
          verified: false,
          error: "Verification request failed"
        },
        500,
        corsHeaders
      );
    }
  }
};

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...headers,
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store"
    }
  });
}
