(() => {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const menu=document.getElementById('menuToggle'),nav=document.getElementById('primaryNav');
  const setMenu=open=>{menu.setAttribute('aria-expanded',String(open));menu.querySelector('span').textContent=open?'−':'+';nav.classList.toggle('is-open',open);};
  menu.addEventListener('click',()=>setMenu(menu.getAttribute('aria-expanded')!=='true'));
  nav.addEventListener('click',event=>{if(event.target.closest('a'))setMenu(false);});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){setMenu(false);menu.focus();}});
  document.addEventListener('click',event=>{if(!event.target.closest('.site-header'))setMenu(false);});

  const tracks={
    ai:{name:'Human × AI',description:'Build a useful tool that keeps people in control. Start with one real workflow and make the improvement clear in your demo.',ideas:['An accessible copilot for a daily task','A research assistant that shows its sources','A creative tool with meaningful human feedback']},
    planet:{name:'Planet+',description:'Make a local problem measurable, understandable, and easier to act on. A small working experiment beats an enormous untested promise.',ideas:['A neighborhood resource-sharing tool','A dashboard for energy or waste data','A repair, reuse, or circular-economy prototype']},
    realities:{name:'New Realities',description:'Explore a new interaction through spatial computing, an immersive interface, or a playful experience people can actually try.',ideas:['A spatial learning experience','An accessible interface beyond the screen','A collaborative world or interactive installation']},
    open:{name:'Open Orbit',description:'Bring the idea that does not fit another track. Define who it helps, show how it works, and make the case through a real prototype.',ideas:['A developer tool you wish existed','A community-first digital service','An unexpected connection between two technologies']}
  };
  const panel=document.getElementById('trackPanel');
  document.querySelectorAll('[data-track]').forEach(button=>button.addEventListener('click',()=>{
    const key=button.dataset.track,track=tracks[key],closing=button.getAttribute('aria-expanded')==='true';
    document.querySelectorAll('[data-track]').forEach(other=>{const active=!closing&&other===button;other.setAttribute('aria-expanded',String(active));other.closest('article').classList.toggle('is-selected',active);});
    panel.hidden=closing;if(closing)return;
    document.getElementById('selectedTrackTitle').textContent=track.name;
    document.getElementById('selectedTrackDescription').textContent=track.description;
    document.getElementById('trackIdeas').replaceChildren(...track.ideas.map(idea=>{const li=document.createElement('li');li.textContent=idea;return li;}));
    document.getElementById('registrationTrack').value=key;
    if(!reduced.matches)panel.animate([{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'none'}],{duration:350,easing:'ease-out'});
    panel.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'center'});panel.focus({preventScroll:true});
  }));

  document.querySelectorAll('[data-day]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-day]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
    let count=0;document.querySelectorAll('[data-program-day]').forEach(item=>{item.hidden=button.dataset.day!=='all'&&item.dataset.programDay!==button.dataset.day;if(!item.hidden){count++;item.classList.add('in-view');}});
    document.getElementById('scheduleCount').textContent=`${count} milestones · ${button.dataset.day==='all'?'all times IST':button.textContent+' · IST'}`;
  }));
  document.getElementById('faqSearch').addEventListener('input',event=>{
    const query=event.target.value.trim().toLowerCase();let count=0;
    document.querySelectorAll('.accordion details').forEach(item=>{item.hidden=!item.textContent.toLowerCase().includes(query);if(!item.hidden){count++;item.classList.add('in-view');}});
    document.getElementById('faqEmpty').hidden=count>0;
  });

  const copy=async(text,status)=>{try{await navigator.clipboard.writeText(text);status.textContent='Copied.';}catch{status.textContent='Copy this: '+text;}};
  document.getElementById('copyEventLink').addEventListener('click',()=>copy('https://moonshot-24.hackhere2026.chatgpt.site/',document.getElementById('copyStatus')));
  document.getElementById('copyReference').addEventListener('click',()=>copy(document.getElementById('registrationReference').textContent,document.getElementById('referenceCopyStatus')));

  const form=document.getElementById('registerForm'),dialog=document.getElementById('registerDialog'),submit=document.getElementById('registrationSubmit'),error=document.getElementById('registrationError');
  let submissionId=crypto.randomUUID(),pending=false,lastSubmittedPayload='';
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(pending||!form.reportValidity())return;
    const values=Object.fromEntries(new FormData(form));values.consent=form.elements.consent.checked;
    const fingerprint=JSON.stringify(values);
    if(lastSubmittedPayload&&lastSubmittedPayload!==fingerprint)submissionId=crypto.randomUUID();
    lastSubmittedPayload=fingerprint;
    pending=true;submit.disabled=true;submit.textContent='Saving your application…';error.hidden=true;
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
    try {
      const response=await fetch('/api/registrations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...values,submissionId}),signal:controller.signal});
      const result=await response.json();
      if(!response.ok||!result.ok)throw new Error(result.error||'Your application could not be saved. Please try again.');
      form.hidden=true;dialog.querySelector('.dialog-copy').hidden=true;
      const success=dialog.querySelector('.form-success');success.hidden=false;
      document.getElementById('profileSummary').textContent=result.duplicate?result.message:`Thank you, ${values.name.trim()}. Your ${tracks[values.track].name} application is saved.`;
      const reference=document.getElementById('registrationReference');reference.hidden=!result.reference;reference.textContent=result.reference||'';
      document.getElementById('copyReference').hidden=!result.reference;
      document.getElementById('referenceCopyStatus').textContent='';
      document.getElementById('registrationNote').textContent=result.duplicate?'An existing application is not changed by this submission. No automatic email is sent.':'Save this reference. Your application has been stored for the organizers to review; this is not yet a confirmed pass. No automatic email is sent.';
      success.focus();submissionId=crypto.randomUUID();lastSubmittedPayload='';
    }catch(reason){error.textContent=reason.name==='AbortError'?'We could not confirm the save in time. Keep your details here and try again; retries will not create duplicates.':reason.message;error.hidden=false;error.scrollIntoView({block:'nearest',behavior:'smooth'});}
    finally{clearTimeout(timeout);pending=false;submit.disabled=false;submit.innerHTML='Submit application <span>↗</span>';}
  });
})();
