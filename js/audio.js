/* Archangel Cosmos - all sound is synthesised live with the Web Audio API (no audio files, no licences needed). */
(function(){
'use strict';
var AC=window.AC,S=AC.settings,ctx=null,master,musicBus,sfxBus,verb,playing=false,nextT=0,step=0,timer=null;
function init(){if(ctx)return true;var A=window.AudioContext||window.webkitAudioContext;if(!A)return false;
 try{ctx=new A();}catch(e){return false;}
 master=ctx.createGain();master.connect(ctx.destination);
 // simple reverb: feedback delays
 verb=ctx.createGain();verb.gain.value=0.35;var out=ctx.createGain();out.connect(master);verb.connect(out);
 [0.13,0.21,0.37].forEach(function(d,i){var dl=ctx.createDelay(1);dl.delayTime.value=d;var fb=ctx.createGain();fb.gain.value=0.45-i*0.08;var lp=ctx.createBiquadFilter();lp.frequency.value=2500;
  verb.connect(dl);dl.connect(lp);lp.connect(fb);fb.connect(dl);lp.connect(out);});
 musicBus=ctx.createGain();sfxBus=ctx.createGain();musicBus.connect(master);sfxBus.connect(master);musicBus.connect(verb);sfxBus.connect(verb);
 apply();return true;}
function apply(){if(!ctx)return;master.gain.value=S.muted?0:1;musicBus.gain.value=S.music*0.5;sfxBus.gain.value=S.sfx;}
function tone(f,t,dur,type,vol,bus,att){var o=ctx.createOscillator(),g=ctx.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);
 g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol||0.2,t+(att||0.01));g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.connect(g);g.connect(bus||sfxBus);o.start(t);o.stop(t+dur+0.05);return o;}
function noise(t,dur,vol,f0,f1){var n=ctx.sampleRate*dur,b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);for(var i=0;i<n;i++)d[i]=Math.random()*2-1;
 var s=ctx.createBufferSource();s.buffer=b;var fl=ctx.createBiquadFilter();fl.type='bandpass';fl.frequency.setValueAtTime(f0,t);fl.frequency.exponentialRampToValueAtTime(f1,t+dur);
 var g=ctx.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);s.connect(fl);fl.connect(g);g.connect(sfxBus);s.start(t);}
var SFX={
 click:function(t){tone(1400,t,0.05,'triangle',0.08);},
 build:function(t){tone(110,t,0.25,'sine',0.35);noise(t,0.15,0.15,800,200);[523,659,784,1047].forEach(function(f,i){tone(f,t+0.05+i*0.06,0.5,'triangle',0.12);});},
 notify:function(t){tone(880,t,0.3,'sine',0.12);tone(1318,t+0.08,0.4,'sine',0.1);},
 error:function(t){tone(220,t,0.18,'square',0.06);tone(196,t+0.12,0.22,'square',0.06);},
 alert:function(t){[0,0.25].forEach(function(d){tone(740,t+d,0.18,'sawtooth',0.07);tone(554,t+d+0.1,0.18,'sawtooth',0.07);});},
 success:function(t){[523,659,784,1047,1319].forEach(function(f,i){tone(f,t+i*0.09,0.9,'sine',0.14);tone(f*2,t+i*0.09,0.5,'triangle',0.03);});},
 launch:function(t){noise(t,2.2,0.35,200,3000);tone(60,t,2,'sawtooth',0.12,null,0.4);},
 vote:function(t){tone(392,t,0.6,'triangle',0.12);tone(587,t+0.15,0.8,'triangle',0.12);}
};
// ambient heavenly music: slow pad chords + pentatonic chimes, scheduled ahead
var CH=[[261.6,329.6,392,493.9],[220,261.6,329.6,392],[174.6,220,261.6,329.6],[196,246.9,293.7,392]],PENTA=[523.3,587.3,659.3,784,880,1046.5,1174.7];
function schedule(){if(!playing)return;while(nextT<ctx.currentTime+1.5){var c=CH[(step/8|0)%4];
  if(step%8===0)c.forEach(function(f,i){[1,1.004].forEach(function(dt){var o=tone(f*dt/(i===0?2:1),nextT,7.5,i===0?'sine':'triangle',0.05,musicBus,2.5);});});
  if(Math.random()<0.45)tone(PENTA[Math.random()*PENTA.length|0],nextT+Math.random()*0.3,2.5,'sine',0.045,musicBus,0.02);
  nextT+=0.9;step++;}}
var A={
 unlock:function(){if(!init())return;if(ctx.state==='suspended')ctx.resume();if(!playing&&S.music>0){playing=true;nextT=ctx.currentTime+0.2;timer=setInterval(schedule,400);schedule();}},
 sfx:function(n){if(!ctx||S.muted||ctx.state!=='running'||!SFX[n])return;try{SFX[n](ctx.currentTime+0.01);}catch(e){}},
 apply:function(){apply();if(ctx&&S.music<=0&&playing){playing=false;clearInterval(timer);}else if(ctx&&S.music>0&&!playing)A.unlock();},
 state:function(){return ctx?ctx.state:'none';}
};
AC.audio=A;
['pointerdown','keydown','touchstart'].forEach(function(ev){addEventListener(ev,function(){A.unlock();},{passive:true});});
})();
