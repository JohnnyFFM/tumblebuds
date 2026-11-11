// node test-levels.js index.html [level] [offset]
// Plays every level with a scripted solution (must win) and once with no orders at all (must lose).
// offset shifts every order by that many pixels along the walking direction, to check that the timing is not too tight.
const fs=require('fs');
const src=fs.readFileSync(process.argv[2],'utf8');
const sim=src.slice(src.indexOf('//#SIM-START'),src.indexOf('//#SIM-END'));
// s: orders for the first bud, in sequence: [skill, x, {d:dir, y0, y1, st}]
// h: buds 2,3.. halt at [x, dir] and are released when the first bud has finished its orders
// all: every bud gets the first of these it can take once it walks past x: [[skill, x], ...]
const SOL=[
{s:[['bash',330]]},
{s:[['dig',400]]},
{s:[['build',400],['build',835]]},
{all:[['climb',300]]},
{s:[['tramp',440]]},
{all:[['float',300]]},
{h:[[280,1]],s:[['build',578]]},
{all:[['bub',420]]},
{s:[['bash',330],['dig',640]]},
{s:[['build',440],['bash',900]]},
{s:[['bash',330]],all:[['bub',545]]},
{h:[[200,1]],s:[['build',300],['build',540],['build',838]]},
{h:[[180,1]],s:[['bash',560],['build',798]]},
{all:[['run',300]]},
{s:[['dig',430],['dig',470,{y0:200}],['dig',505,{y0:270}],['bash',760,{y0:330}]]},
{h:[[300,1]],s:[['dig',620],['bash',770,{y0:335}],['build',925,{y0:335}]]},
{s:[['bomb',400]]},
{h:[[250,1]],s:[['float',300],['build',620,{d:-1}],['bash',730]]},
{h:[[240,1]],s:[['bash',300],['build',515],['dig',700,{y1:215}],['bash',900,{y0:370}],['build',1290]]},
{h:[[790,-1]],s:[['bash',760,{d:-1}],['build',515,{d:-1}]]},
{all:[['jet',510]]},
{h:[[300,1]],s:[['dig',800],['build',1172,{y0:390}]]},
{h:[[200,1]],s:[['tramp',430],['bomb',600,{y1:285}],['build',872,{y0:330}]]},
{h:[[250,1]],s:[['dig',400],['bash',0,{st:'dig',y0:240}],['build',797,{y0:330}]]},
{h:[[180,1]],s:[['bash',440],['build',600],['build',800],['build',1058]]},
{s:[['tramp',430]],all:[['jet',738]]},
{h:[[200,1]],s:[['build',335],['build',620],['bash',790,{y0:290}],['build',955,{y0:290}]]},
{all:[['climb',380],['bub',380]]},
{h:[[200,1]],s:[['dig',330],['bash',0,{st:'dig',y0:235}],['bash',580,{y0:330}],['build',815],['build',1000],['build',1190]]},
{h:[[200,1]],s:[['float',250],['build',470,{d:-1}],['bash',560],['dig',810,{y0:330}],['build',1205,{y0:400}]]}
];
const run=new Function('SOL','only','off',sim+`
const out=[];
if(SOL.length!==LEVELS.length)out.push('FAIL '+SOL.length+' solutions for '+LEVELS.length+' levels');
for(let li=0;li<LEVELS.length;li++){
  if(only>=0&&li!==only)continue;
  buildLevel(li);
  const play=(sol)=>{
    resetSim();const log=[];let k=0,rel=false;const halted=[],got={},S0=sol.s||[];
    FX.ev=(n,c)=>{if(n==='splat'||n==='drown')log.push(n+' #'+c.id+' @'+c.x+','+c.y+' t'+G.tick);};
    while(!G.ended){
      stepSim();
      const sc=G.buds.find(b=>b.id===0);
      if(sc&&k<S0.length){
        const [sk,x0,o]=S0[k],q=o||{},d=q.d||1,x=x0+off*d;
        const stOk=sk==='float'?true:sc.st===(q.st||'walk');
        if(stOk&&(q.st||sk==='float'||sc.dir===d)&&(d>0?sc.x>=x:sc.x<=x)&&(q.y0==null||sc.y>=q.y0)&&(q.y1==null||sc.y<=q.y1)){
          if(assign(sc,sk)){log.push(sk+' @'+sc.x+','+sc.y+' t'+G.tick);k++;}
        }
      }
      (sol.h||[]).forEach((h,i)=>{if(halted[i])return;const b=G.buds.find(b=>b.id===i+1);if(b&&b.st==='walk'&&b.dir===h[1]&&(h[1]>0?b.x>=h[0]:b.x<=h[0])){if(assign(b,'stop'))halted[i]=b;}});
      if(sol.all)for(const b of G.buds)if(!got[b.id]&&b.st==='walk')for(const a of sol.all)if(b.x>=a[1]+off&&assign(b,a[0])){got[b.id]=1;break;}
      if(!rel&&k>=S0.length&&(!sc||sc.st==='walk'||sc.st==='exit')){rel=true;for(const b of halted)if(b)release(b);log.push('release t'+G.tick);}
    }
    log.push('END '+G.buds.map(b=>b.id+':'+b.st+'@'+b.x+','+b.y+(b.dir>0?'>':'<')).join(' '));
    return {saved:G.saved,lost:G.lost,secs:Math.round(G.tick/60),steps:k+'/'+S0.length,log};
  };
  const a=play(SOL[li]);
  resetSim();FX.ev=()=>{};while(!G.ended)stepSim();
  const ncards=Object.keys(LEVELS[li].c).length,ok=a.saved>=NEED&&G.saved<NEED&&ncards<=6;
  out.push((ok?'ok  ':'FAIL')+' L'+(li+1)+' saved '+a.saved+'/'+TOTAL+' need '+NEED+' lost '+a.lost+' '+a.secs+'s of '+TIME_LIMIT/60+' steps '+a.steps+' cards '+ncards+' | idle saved '+G.saved+(ok&&only<0?'':'\\n   '+a.log.slice(-12).join('\\n   ')));
}
return out;`);
console.log(run(SOL,process.argv[3]?+process.argv[3]-1:-1,+process.argv[4]||0).join('\n'));
