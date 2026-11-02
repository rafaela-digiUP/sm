const { chromium } = require('playwright'); const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
await p.goto('file://'+path.resolve('carrossel.html'),{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
await p.evaluate(()=>document.body.classList.add('export'));
for(let i=1;i<=4;i++){await p.locator('#s'+i).screenshot({path:`ov${i}.png`,omitBackground:i<4});}
await b.close();})();
