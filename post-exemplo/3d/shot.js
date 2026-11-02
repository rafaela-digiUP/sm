const { chromium } = require('playwright');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  for (const [mode,w,h] of [['hero',2000,1600],['field',2160,1350]]){
    const p=await b.newPage({viewport:{width:w,height:h}});
    p.on('console',m=>console.log(mode,m.text())); p.on('pageerror',e=>console.log(mode,'ERR',e.message));
    await p.goto(`http://localhost:8765/scene.html?mode=${mode}&w=${w}&h=${h}`);
    await p.waitForFunction(()=>window.__done===true,{timeout:120000});
    await p.locator('canvas').screenshot({path:`${mode}.png`,omitBackground:true});
    console.log('ok',mode);
  }
  await b.close();
})();
