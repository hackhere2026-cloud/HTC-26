// One shared, frame-rate-independent starfield for the page and title glass.
(() => {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const stage=document.getElementById('heroStage');
  const targets=['sky','windshieldSky'].map(id=>{
    const canvas=document.getElementById(id);
    return {canvas,ctx:canvas?.getContext('2d')};
  }).filter(target=>target.ctx);
  if(!targets.length)return;
  let width=innerWidth,height=innerHeight,stars=[],raf=0,last=0,clock=0,heroVisible=true;
  const pointer={x:0,y:0},look={x:0,y:0};
  const colors=['#fffdf5','#6ee7ff','#aaa4cf'];
  const glows=colors.map(color=>{
    const sprite=document.createElement('canvas');sprite.width=sprite.height=48;
    const ctx=sprite.getContext('2d'),gradient=ctx.createRadialGradient(24,24,0,24,24,24);
    gradient.addColorStop(0,color);gradient.addColorStop(.12,color+'99');gradient.addColorStop(1,color+'00');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,48,48);return sprite;
  });
  function resize(){
    const oldWidth=width,oldHeight=height;width=innerWidth;height=innerHeight;
    const dpr=Math.min(devicePixelRatio||1,width<760?1.35:1.75);
    for(const {canvas,ctx} of targets){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
    stars.forEach(star=>{star.x=star.x/oldWidth*width;star.y=star.y/oldHeight*height;});
    const count=Math.min(width<760?100:220,Math.max(80,Math.round(width*height/6500)));
    stars.length=Math.min(stars.length,count);
    while(stars.length<count){
      const depth=[.22,.52,1][stars.length%3];
      stars.push({x:Math.random()*width,y:Math.random()*height,depth,r:.4+depth*Math.random()*1.4,alpha:.25+Math.random()*.45,phase:Math.random()*Math.PI*2,color:stars.length%7===0?1:stars.length%5===0?2:0});
    }
    render(0);sync();
  }
  function render(dt){
    const still=reduced.matches;
    clock+=still?0:dt;
    look.x+=(pointer.x-look.x)*(1-Math.exp(-dt*2));look.y+=(pointer.y-look.y)*(1-Math.exp(-dt*2));
    for(const star of stars){
      if(!still){star.x+=(2+star.depth*7)*dt;star.y-=dt*(.7+star.depth*2);}
      if(star.x>width+30)star.x=-30;
      if(star.y< -30)star.y=height+30;
    }
    for(const {canvas,ctx} of targets){
      // Avoid drawing a hidden second canvas during the car intro or below it.
      if(canvas.id==='windshieldSky'&&(!heroVisible||!stage.classList.contains('inside-windshield')))continue;
      ctx.clearRect(0,0,width,height);
      for(const star of stars){
        const x=star.x+(still?0:look.x*star.depth*12+Math.sin(clock*.16+star.phase)*star.depth*5);
        const y=star.y+(still?0:look.y*star.depth*8+Math.cos(clock*.12+star.phase)*star.depth*5);
        ctx.globalAlpha=star.alpha*(still?.85:.77+Math.sin(clock*.55+star.phase)*.23);
        if(star.depth===1){const size=star.r*12;ctx.drawImage(glows[star.color],x-size/2,y-size/2,size,size);}
        ctx.fillStyle=colors[star.color];ctx.beginPath();ctx.arc(x,y,star.r,0,Math.PI*2);ctx.fill();
      }
      ctx.globalAlpha=1;
    }
  }
  function frame(now){
    raf=0;if(document.hidden||reduced.matches)return;
    const delta=last?(now-last)/1000:1/30;
    if(delta>=1/30){render(Math.min(delta,.1));last=now;}
    raf=requestAnimationFrame(frame);
  }
  function sync(){
    cancelAnimationFrame(raf);raf=0;last=0;
    document.documentElement.dataset.spaceMotion=reduced.matches?'still':document.hidden?'paused':'drifting';
    if(!document.hidden){render(0);if(!reduced.matches)raf=requestAnimationFrame(frame);}
  }
  addEventListener('pointermove',event=>{if(event.pointerType!=='touch'){pointer.x=event.clientX/width-.5;pointer.y=event.clientY/height-.5;}},{passive:true});
  document.addEventListener('pointerleave',()=>{pointer.x=0;pointer.y=0;});
  addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',sync);
  reduced.addEventListener('change',sync);
  document.addEventListener('cloud:intro-complete',()=>render(0));
  document.addEventListener('cloud:skip-intro',()=>requestAnimationFrame(()=>render(0)));
  new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;if(heroVisible)render(0);}).observe(stage);
  // Final title changes can happen without scrolling, including reduced motion.
  let inside=false;
  new MutationObserver(()=>{const next=stage.classList.contains('inside-windshield');if(next&&!inside)render(0);inside=next;}).observe(stage,{attributes:true,attributeFilter:['class']});
  resize();
})();
