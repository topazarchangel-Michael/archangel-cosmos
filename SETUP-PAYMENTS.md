# Setting up payments for Archangel Cosmos (beginner guide)

Right now **no payments are switched on**. The Store shows "Coming soon" and every expansion and cosmetic is unlocked so you can test the whole game. Do the steps below only when you are ready to sell. They cost nothing up front: Stripe charges a small fee per sale and Cloudflare Workers has a free plan.

You will need about an hour, an email address, your bank account details (for Stripe payouts) and some ID. In Australia Stripe also asks for an ABN or your personal details as a sole trader.

---

## Step 1: Create a Stripe account
1. Go to **https://dashboard.stripe.com/register** and sign up.
2. Choose **Australia** as the country, so prices will be in AUD.
3. Stay in **Test mode** (switch at the top right) while you practise. Test mode uses fake cards like `4242 4242 4242 4242`, so no real money moves.

## Step 2: Create one product per item
In Stripe go to **Product catalogue → Add product**. Create these, each as a **one-off** price in **AUD**:

| Item id (used by the game) | Product name | Price (AUD) |
|---|---|---|
| `starborn` | Archangel: Starborn expansion | 7.99 |
| `empires` | Galactic Empires expansion | 9.99 |
| `architect` | Universe Architect expansion | 12.99 |
| `cosmos` | Archangel Cosmos expansion | 14.99 |
| `founder` | Founder Supporter Pack | 14.99 |
| `skin_gold` | Building skin: Gilded Throne | 2.99 |
| `skin_sapphire` | Building skin: Sapphire Host | 2.99 |
| `skin_rose` | Building skin: Rose Dawn | 2.99 |
| `halo_seraph` | Halo & wings: Seraphim Flame | 1.99 |
| `halo_cherub` | Halo & wings: Cherub Frost | 1.99 |
| `theme_aurora` | Planet theme: Aurora Elysia | 2.49 |
| `theme_twilight` | Planet theme: Eternal Twilight | 2.49 |

You can change these prices. If you do, also change the `price:` numbers in `js/store.js` so the Store shows the right amount.

## Step 3: Make a Payment Link for each product
1. Open a product and click **Create payment link**.
2. Under **After payment**, choose **Don't show confirmation page → Redirect customers to your website**, and enter:
   `https://topazarchangel-michael.github.io/archangel-cosmos/index.html?session_id={CHECKOUT_SESSION_ID}`
   (type `{CHECKOUT_SESSION_ID}` exactly like that; Stripe fills it in).
3. Save. Copy the link (it looks like `https://buy.stripe.com/abc123`).
4. Also note the link's id. Open the link in the dashboard and the address bar shows `plink_...`.

Write down a list like: `starborn → https://buy.stripe.com/abc123 → plink_1Abc...`

## Step 4: Deploy the free verification server (Cloudflare Worker)
This small program checks with Stripe that a payment really happened, so nobody can unlock items for free by typing a fake address. Your **secret key never goes into the game**.
1. Sign up free at **https://dash.cloudflare.com/sign-up**.
2. Go to **Workers & Pages → Create → Create Worker**. Name it `archangel-pay`, then click **Deploy**.
3. Click **Edit code**, delete everything, paste in the contents of `server/cloudflare-worker/worker.js` from this project, then click **Deploy**.
4. Go to the worker's **Settings → Variables and Secrets** and add:
   - `STRIPE_SECRET_KEY` (type **Secret**): in Stripe, go to **Developers → API keys → Secret key** (starts `sk_test_` in test mode, `sk_live_` when live).
   - `LINK_MAP` (type **Secret** or Text): your links as JSON, for example
     `{"plink_1Abc":"starborn","plink_1Def":"empires","plink_1Ghi":"founder"}`
   - `ALLOWED_ORIGIN` (Text): `https://topazarchangel-michael.github.io`
5. Your worker's address is shown at the top, e.g. `https://archangel-pay.yourname.workers.dev`. The verify address is that plus `/verify`.

## Step 5: Turn payments on in the game
Open `js/store.js` and edit the `CONFIG` block near the top:
```js
PAYMENTS_ENABLED: true,
DEV_UNLOCK_ALL: false,
PROVIDER: 'stripe',
VERIFY_URL: 'https://archangel-pay.yourname.workers.dev/verify',
LINKS: { starborn: 'https://buy.stripe.com/abc123', empires: '...', founder: '...', /* etc */ }
```
Then commit and push to GitHub as usual. Also open `sw.js` and bump the cache name (e.g. `archangel-cosmos-v6`) so installed copies update.

## Step 6: Test, then go live
1. With Stripe still in **Test mode**, open the live site, buy something with card `4242 4242 4242 4242` (any future date, any CVC). You should return to the game and see "Thank you! … unlocked".
2. When it works, switch Stripe to **Live mode**. Re-create the products and Payment Links there (live and test are separate). Update `LINK_MAP`, `STRIPE_SECRET_KEY` (now `sk_live_...`) and the `LINKS` in `js/store.js`. Push again.

## Good to know
- Purchases are remembered **in the player's browser** (like saves). If they clear browser data or change device, they need to contact you with their Stripe receipt. You can then give them a refund or a manual unlock. A proper account/"restore purchases" system would need a database; it can be added later.
- The **rewarded ads** button is a placeholder only. No ad network is connected. If you ever add one (e.g. Google AdSense for games), it plugs into `showRewardedAd()` in `js/store.js` and needs a privacy policy.
- **Ko-fi** alternative: set `PROVIDER: 'ko-fi'` style links in `LINKS` (`https://ko-fi.com/s/...`). Ko-fi has no automatic verification, so unlocks would have to be manual.
- Keep **Genesis free**. Cosmetics never change gameplay power (no pay-to-win).
- You are responsible for GST once your turnover passes the ATO threshold, and for refunds under Australian Consumer Law. Stripe's dashboard can produce the reports you need.
