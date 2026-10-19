# Save robustness tests. Run: python3 test_save.py
import os, shutil, subprocess, time, json, tempfile, re
from playwright.sync_api import sync_playwright
D=os.path.dirname(os.path.abspath(__file__)); T=tempfile.mkdtemp(); SRV=T+'/site'
shutil.copytree(D,SRV,ignore=shutil.ignore_patterns('.git','screenshot*.png','*.zip'))
srv=subprocess.Popen(['python3','-m','http.server','8765','-d',SRV],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
URL='http://localhost:8765/index.html'; errs=[]; res={}
def watch(pg): pg.on('dialog',lambda d:d.accept()); pg.on('console',lambda m:m.type=='error' and errs.append(m.text)); pg.on('pageerror',lambda e:errs.append(str(e)))
def ready(pg): pg.wait_for_function("window.AC&&AC.saves&&new Promise(r=>AC.saves.whenReady(()=>r(true)))")
try:
  with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':1366,'height':800}); pg=ctx.new_page(); watch(pg)
    pg.goto(URL); ready(pg); pg.click('#btnNew'); pg.wait_for_timeout(800)
    pg.evaluate("AC.settings.r3d='off';AC.v3d.setOn(false)")
    pg.evaluate("()=>{for(let i=0;i<5;i++)AC.api.tick()}")
    day=pg.evaluate("AC.api.save(false,'manual');AC.api.state().day")
    res['indicator']=pg.evaluate("document.getElementById('saveInd').textContent").startswith('Saved')
    pg.evaluate("()=>new Promise(r=>setTimeout(r,500))")
    res['idb']=pg.evaluate("AC.saves.usingIDB()")
    # 1 reload: Continue loads same day
    pg.reload(); ready(pg); res['continueLabel']=pg.evaluate("document.getElementById('btnContinue').textContent")
    pg.click('#btnContinue'); pg.wait_for_timeout(800); res['reload']=pg.evaluate("AC.api.state().day"); print('saved day',day,'loaded day',res['reload']); res['reload']=day<=res['reload']<=day+2
    # 2 autosave on hidden
    pg.evaluate("()=>{for(let i=0;i<3;i++)AC.api.tick();Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});document.dispatchEvent(new Event('visibilitychange'))}")
    d2=pg.evaluate("AC.api.state().day"); pg.reload(); ready(pg); res['hiddenSave']=pg.evaluate("AC.saves.info(1).day")==d2
    # 3 SW update: register, bump version, reload twice
    pg.wait_for_function("navigator.serviceWorker&&navigator.serviceWorker.controller",timeout=15000)
    s=open(SRV+'/sw.js').read(); open(SRV+'/sw.js','w').write(re.sub(r"archangel-cosmos-v\d+","archangel-cosmos-v999",s))
    pg.evaluate("navigator.serviceWorker.getRegistration().then(r=>r.update())"); pg.wait_for_timeout(2500); pg.reload(); ready(pg); pg.reload(); ready(pg)
    res['swUpdated']=pg.evaluate("caches.keys()"); res['swSurvive']=pg.evaluate("AC.saves.info(1)&&AC.saves.info(1).day")==d2
    # 4 large late-game state
    pg.click('#btnContinue'); pg.wait_for_timeout(800)
    big=pg.evaluate("""()=>{const G=AC.api.state();G.junk=[];for(let i=0;i<30000;i++)G.junk.push({id:i,n:'colony-'+i,v:i*1.5,tags:['a','b']});G.mil=G.mil||{};const raw=JSON.stringify(G).length;const r=AC.saves.put(1,G,'manual');return r.promise.then(()=>({raw,size:r.size,ok:r.ok,ls:r.ls}))}""")
    res['large']=big
    pg.reload(); ready(pg); res['largeLoad']=pg.evaluate("()=>JSON.parse(AC.saves.get(1).json).junk.length")==30000
    # 6 export/import round trip
    with pg.expect_download() as dl: pg.evaluate("AC.saves.exportFile(JSON.parse(AC.saves.get(1).json))")
    txt=open(dl.value.path()).read(); res['exportImport']=pg.evaluate("t=>AC.saves.parseImport(t).junk.length",txt)==30000
    # 5 corrupt main -> backup fallback
    pg.evaluate("()=>{AC.saves._cache['slot1']='{broken';}")
    res['backupFallback']=pg.evaluate("(AC.saves.get(1)||{}).from")
    # 7 legacy v1 key import
    ctx2=b.new_context(); pg2=ctx2.new_page(); watch(pg2); pg2.goto(URL); ready(pg2)
    g=pg2.evaluate("()=>{document.getElementById('btnNew').click();return JSON.stringify(AC.api.state())}")
    pg2.evaluate("g=>{localStorage.clear();localStorage.setItem('archangelCosmos.save.v1',g)}",g); pg2.evaluate("indexedDB.deleteDatabase('archangel-cosmos')")
    pg2.reload(); ready(pg2); res['legacy']=pg2.evaluate("AC.saves.has(1)")
    # 8 slot selection persists
    pg2.evaluate("()=>{const s=document.getElementById('selSlot');if(s){s.value=s.options[1]?s.options[1].value:'1';s.onchange&&s.onchange()}}"); pg2.reload(); ready(pg2)
    res['slotPersist']=pg2.evaluate("localStorage.getItem('archangelCosmos.slotSel')")
    b.close()
finally: srv.kill()
for k,v in res.items(): print(k,':',v)
print('errors',errs[:5])
