/* Archangel Cosmos - monetisation scaffolding. NO REAL PAYMENTS ARE TAKEN.
   ------------------------------------------------------------------------
   Everything is controlled by CONFIG below.
   - PAYMENTS_ENABLED=false (current): every purchase button shows "Coming soon" and,
     because DEV_UNLOCK_ALL is true, every item is unlocked so the full game can be tested.
   - To go live later: set PAYMENTS_ENABLED=true, DEV_UNLOCK_ALL=false, choose a PROVIDER
     ('stripe' = Stripe Payment Links, 'kofi' = Ko-fi shop links) and paste each item's link into LINKS.
     After payment, the provider should redirect back to  index.html?unlock=<itemId>&code=<code>
     (a real deployment must verify codes on a server; see verifyCode() - client-only codes are NOT secure).
   - Rewarded ads use a placeholder slot (no ad network). Plug an ad SDK into showRewardedAd(). */
(function(){
'use strict';
var AC=window.AC,H=AC.H;
var CONFIG={
 PAYMENTS_ENABLED:false,
 DEV_UNLOCK_ALL:true,          // keep everything unlocked while payments are disabled (testing)
 PROVIDER:'stripe',            // 'none' | 'stripe' | 'kofi'  (only used when PAYMENTS_ENABLED is true)
 PAID_SPEEDUP:false,           // future paid instant-construction (disabled; never pay-to-win in Genesis)
 VERIFY_URL:'',                // your deployed verification worker, e.g. 'https://archangel-pay.<you>.workers.dev/verify' (see SETUP-PAYMENTS.md)
 CURRENCY:'AUD',
 LINKS:{                       // e.g. 'https://buy.stripe.com/xxxx' or 'https://ko-fi.com/s/xxxx'
  founder:'',starborn:'',empires:'',   // Stripe Payment Links: https://buy.stripe.com/... (see SETUP-PAYMENTS.md)
  skin_gold:'',skin_sapphire:'',skin_rose:'',halo_seraph:'',halo_cherub:'',theme_aurora:'',theme_twilight:''},
 AD_COOLDOWN_MIN:10
};
var ITEMS=[
 {id:'starborn',type:'expansion',n:'Archangel: Starborn expansion',price:7.99,d:'Phase 2: the Helion solar system, ships, colonies and space resources. (Genesis is free forever.)'},
 {id:'empires',type:'expansion',n:'Galactic Empires expansion',price:9.99,d:'Phase 3 (in development).',soon:true},
 {id:'founder',type:'pack',n:'Founder Supporter Pack',price:14.99,d:'One-time: Founder badge, 3 extra save slots, early access to new phases, golden Founder halo.'},
 {id:'skin_gold',type:'skin',n:'Building skin: Gilded Throne',price:2.99,d:'Rich gold leaf on every structure. Cosmetic only.'},
 {id:'skin_sapphire',type:'skin',n:'Building skin: Sapphire Host',price:2.99,d:'Cool sapphire and silver marble. Cosmetic only.'},
 {id:'skin_rose',type:'skin',n:'Building skin: Rose Dawn',price:2.99,d:'Soft rose-quartz glow. Cosmetic only.'},
 {id:'halo_seraph',type:'halo',n:'Halo & wings: Seraphim Flame',price:1.99,d:'Six-winged fiery emblem on the title screen. Cosmetic only.'},
 {id:'halo_cherub',type:'halo',n:'Halo & wings: Cherub Frost',price:1.99,d:'Icy silver halo and wings. Cosmetic only.'},
 {id:'theme_aurora',type:'theme',n:'Planet theme: Aurora Elysia',price:2.49,d:'Emerald-teal aurora tint over Elysia. Cosmetic only.'},
 {id:'theme_twilight',type:'theme',n:'Planet theme: Eternal Twilight',price:2.49,d:'Violet-gold twilight palette. Cosmetic only.'}
];
var SKINS={skin_gold:{tint:'rgba(255,200,60,0.38)',op:'overlay'},skin_sapphire:{tint:'rgba(70,130,255,0.45)',op:'color'},skin_rose:{tint:'rgba(255,120,170,0.4)',op:'color'}};
var THEMES={theme_aurora:{tint:'rgba(40,220,180,0.22)',op:'soft-light'},theme_twilight:{tint:'rgba(150,70,230,0.28)',op:'soft-light'}};
var HALOS={halo_seraph:'hue-rotate(-35deg) saturate(1.8)',halo_cherub:'hue-rotate(170deg) saturate(.6) brightness(1.15)'};
var KEY='archangelCosmos.store';
var st={owned:{},equip:{skin:'',halo:'',theme:''},lastAd:0};
try{Object.assign(st,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(st));}catch(e){}}
function devUnlocked(){return !CONFIG.PAYMENTS_ENABLED&&CONFIG.DEV_UNLOCK_ALL;}
function owns(id){if(id==='genesis')return true;return devUnlocked()||!!st.owned[id];}
function price(it){return 'A$'+it.price.toFixed(2);}
function toast(t,k){if(AC.api)AC.api.toast(t,k);}
// Payment provider adapters (no network calls happen while PAYMENTS_ENABLED=false)
var PROVIDERS={
 none:function(it){toast('Purchases are coming soon. '+it.n+' will cost '+price(it)+'.');},
 stripe:function(it){var u=CONFIG.LINKS[it.id];if(!u)return toast('No Stripe Payment Link configured for '+it.n+'.');window.open(u+(u.indexOf('?')<0?'?':'&')+'client_reference_id='+encodeURIComponent(it.id+'_'+deviceId()),'_blank','noopener');},
 kofi:function(it){var u=CONFIG.LINKS[it.id];if(!u)return toast('No Ko-fi link configured for '+it.n+'.');window.open(u,'_blank','noopener');}
};
function buy(id){var it=ITEMS.find(function(x){return x.id===id;});if(!it)return;
 if(!CONFIG.PAYMENTS_ENABLED||it.soon)return toast('Coming soon: '+it.n+' ('+price(it)+'). No payment is taken yet'+(devUnlocked()?'; it is unlocked for testing.':'.'));
 (PROVIDERS[CONFIG.PROVIDER]||PROVIDERS.none)(it);}
function deviceId(){if(!st.device){st.device=Math.random().toString(36).slice(2,10);persist();}return st.device;}
function verifyCode(id,code){return false;}
// Stripe return flow: set each Payment Link's "after payment" redirect to  <your site>/index.html?session_id={CHECKOUT_SESSION_ID}
function verifyStripeSession(sid){if(!CONFIG.PAYMENTS_ENABLED||!CONFIG.VERIFY_URL)return;
 fetch(CONFIG.VERIFY_URL+'?session_id='+encodeURIComponent(sid)).then(function(r){return r.json();}).then(function(j){
  if(j&&j.paid&&j.item&&ITEMS.some(function(i){return i.id===j.item;})){grant(j.item);(st.receipts=st.receipts||[]).push({item:j.item,session:sid,date:Date.now()});persist();setTimeout(function(){toast('Thank you! '+j.item+' unlocked.','success');},1500);}
  else setTimeout(function(){toast('Payment could not be verified. Contact support with your receipt.');},1500);
  history.replaceState(null,'',location.pathname);}).catch(function(){setTimeout(function(){toast('Could not reach the payment server; try again later.');},1500);});}
(function(){var m=/[?&]session_id=([\w-]+)/.exec(location.search||'');if(m)verifyStripeSession(m[1]);})();
function grant(id){st.owned[id]=true;persist();}
// handle return from a provider: ?unlock=id&code=...
(function(){var m=/[?&]unlock=([\w]+)&code=([\w-]+)/.exec(location.search||'');if(m&&CONFIG.PAYMENTS_ENABLED&&verifyCode(m[1],m[2]))grant(m[1]);})();
function equip(slot,id){if(id&&!owns(id))return toast('Not owned yet.');st.equip[slot]=st.equip[slot]===id?'':id;persist();applyCosmetics();if(AC.api){AC.render.needTerrain=true;AC.api.dirty();}}
function applyCosmetics(){var e=document.querySelector('.emblem');if(e)e.style.filter=(HALOS[st.equip.halo]||'')+' drop-shadow(0 0 18px rgba(255,220,130,.6))';
 document.body.classList.toggle('founder',owns('founder')&&CONFIG.PAYMENTS_ENABLED?!!st.owned.founder:owns('founder'));}
// Rewarded ad placeholder: shows a 5 second "ad" panel, then grants a small bonus. No ad network, no tracking.
function showRewardedAd(onReward){var now=Date.now(),cd=CONFIG.AD_COOLDOWN_MIN*60000;if(now-st.lastAd<cd)return toast('Next bonus available in '+Math.ceil((cd-(now-st.lastAd))/60000)+' min.');
 var box=document.createElement('div');box.className='adslot';box.innerHTML='<div class="panel-box"><h2>Ad placeholder</h2><p>No real ads are shown. A future ad partner could appear here.</p><p class="adcount">5</p></div>';document.body.appendChild(box);
 var n=5,iv=setInterval(function(){n--;var c=box.querySelector('.adcount');if(c)c.textContent=n;if(n<=0){clearInterval(iv);box.remove();st.lastAd=Date.now();persist();onReward();}},1000);}
H.act.buy=function(G,id){buy(id);};
H.act.equip=function(G,arg){var p=arg.split(':');equip(p[0],p[1]);};
H.act.watchAd=function(G){showRewardedAd(function(){var g=AC.api.state();if(g){g.res.credits+=2500;g.res.research+=10;}toast('Bonus received: +2,500 Credits, +10 Research.','success');AC.api.render();});};
H.act.openStore=function(){if(H.act.tab)H.act.tab('store');};
H.panel.store=function(G){var h='<h3>Celestial Store</h3><p class="small">'+(CONFIG.PAYMENTS_ENABLED?'Prices in '+CONFIG.CURRENCY+'.':'<b>Coming soon.</b> No payments are taken yet. Prices shown are placeholders in AUD. '+(devUnlocked()?'Everything is unlocked for testing.':''))+' Cosmetics never affect gameplay power.</p>';
 var groups={expansion:'Expansions (Genesis is free)',pack:'Supporter',skin:'Building skins',halo:'Halo & wing styles',theme:'Planet themes'},slot={skin:'skin',halo:'halo',theme:'theme'};
 Object.keys(groups).forEach(function(g){h+='<h3>'+groups[g]+'</h3>';ITEMS.filter(function(i){return i.type===g;}).forEach(function(it){var o=owns(it.id);
  h+='<div class="card"><span class="t">'+it.n+'</span> <small>'+price(it)+'</small>'+(o?' <span class="live">'+(st.owned[it.id]?'OWNED':'UNLOCKED (TEST)')+'</span>':'')+'<br><span class="e">'+it.d+'</span><br>'+
   (o&&slot[g]?'<button data-act="equip" data-arg="'+slot[g]+':'+it.id+'">'+(st.equip[slot[g]]===it.id?'Unequip':'Equip')+'</button>':'')+
   (!st.owned[it.id]?'<button data-act="buy" data-arg="'+it.id+'">'+(CONFIG.PAYMENTS_ENABLED&&!it.soon?'Buy '+price(it):'Coming soon')+'</button>':'')+'</div>';});});
 h+='<h3>Free bonus</h3><div class="card">Watch a short (placeholder) ad for +2,500 Credits and +10 Research. Every '+CONFIG.AD_COOLDOWN_MIN+' min.<br><button data-act="watchAd">▶ Get bonus</button></div>';
 return h;};
H.act.paidRush=function(G,i){if(!CONFIG.PAYMENTS_ENABLED||!CONFIG.PAID_SPEEDUP)return toast('Paid speed-ups are not available. Use Celestial Light instead.');/* future: buy('speedup') then AC.api.complete(+i) after verification */};
AC.store={verifyStripeSession:verifyStripeSession,CONFIG:CONFIG,ITEMS:ITEMS,owns:owns,buy:buy,equip:equip,state:st,skin:function(){return SKINS[st.equip.skin];},theme:function(){return THEMES[st.equip.theme];},
 extraSlots:function(){return owns('founder')?3:0;},showRewardedAd:showRewardedAd,applyCosmetics:applyCosmetics,earlyAccess:function(){return owns('founder');}};
H.init.push(applyCosmetics);
})();
