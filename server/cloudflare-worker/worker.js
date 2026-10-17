/**
 * Archangel Cosmos - Stripe purchase verification (Cloudflare Worker, free plan).
 * NOT DEPLOYED. Michael deploys it himself later - see SETUP-PAYMENTS.md.
 *
 * The game calls:  GET https://<worker>/verify?session_id=cs_...
 * The worker asks Stripe whether that Checkout Session was paid, works out which item
 * it was (from the Payment Link id), and answers {paid:true,item:"starborn"}.
 *
 * Secrets / variables (set in the Cloudflare dashboard, never in the game code):
 *   STRIPE_SECRET_KEY   - your Stripe secret key (sk_live_... or sk_test_...)
 *   LINK_MAP            - JSON mapping Payment Link ids to item ids, e.g.
 *                         {"plink_123":"starborn","plink_456":"founder"}
 *   ALLOWED_ORIGIN      - https://topazarchangel-michael.github.io
 */
export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || '*';
    const cors = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Content-Type': 'application/json' };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    const url = new URL(request.url);
    if (url.pathname !== '/verify') return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers: cors });
    const sid = url.searchParams.get('session_id') || '';
    if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sid)) return new Response(JSON.stringify({ paid: false, error: 'bad session id' }), { status: 400, headers: cors });
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions/' + sid, { headers: { Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY } });
    if (!r.ok) return new Response(JSON.stringify({ paid: false, error: 'session not found' }), { status: 404, headers: cors });
    const s = await r.json();
    let map = {};
    try { map = JSON.parse(env.LINK_MAP || '{}'); } catch (e) {}
    let item = map[s.payment_link] || null;
    if (!item && s.client_reference_id) item = String(s.client_reference_id).split('_')[0];
    const paid = s.payment_status === 'paid' && s.status === 'complete';
    return new Response(JSON.stringify({ paid, item: paid ? item : null }), { headers: cors });
  }
};
