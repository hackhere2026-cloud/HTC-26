import { database } from '../db/index.js';

const roles = new Set(['Engineering','Design','Product','Research','Something else entirely']);
const tracks = new Set(['ai','planet','realities','open']);
const maxBodyBytes = 8192;
const json = (value,status=200,extra={}) => Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});
const clean = value => typeof value === 'string' ? value.trim() : '';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateRegistration(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const value={submissionId:clean(input.submissionId),name:clean(input.name),email:clean(input.email).toLowerCase(),role:clean(input.role),track:clean(input.track),teamName:clean(input.teamName)};
  if(!uuid.test(value.submissionId)||value.name.length<2||value.name.length>100||/[\u0000-\u001f]/.test(value.name)||value.email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(value.email)||!roles.has(value.role)||!tracks.has(value.track)||value.teamName.length>100||input.consent!==true||clean(input.website))return null;
  return value;
}

async function readBody(request) {
  if(Number(request.headers.get('content-length'))>maxBodyBytes)throw new Error('BODY_TOO_LARGE');
  const reader=request.body?.getReader();if(!reader)return null;
  const chunks=[];let length=0;
  while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>maxBodyBytes){await reader.cancel();throw new Error('BODY_TOO_LARGE');}chunks.push(value);}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function hash(value) {
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
}

export async function register(request,env,ctx) {
  const origin=request.headers.get('origin');
  if(origin!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site')return json({error:'Please submit the form from this website.'},403);
  if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return json({error:'Use the registration form to apply.'},415);
  let input;
  try {input=await readBody(request);}catch(error){return json({error:error.message==='BODY_TOO_LARGE'?'Application is too large.':'The application could not be read.'},error.message==='BODY_TOO_LARGE'?413:400);}
  const value=validateRegistration(input);
  if(!value)return json({error:'Check your name, email, role, track, and consent, then try again.'},400);
  try {
    const db=database(env), now=Date.now(), window=Math.floor(now/600000);
    // Never retain raw IP addresses. Limit metadata expires and is cleaned in bounded batches.
    const rateKey=await hash(`htc-registration|${new URL(request.url).host}|${request.headers.get('cf-connecting-ip')||'local-preview'}`);
    const rate=await db.prepare('INSERT INTO registration_rate_limits (key, window, count) VALUES (?, ?, 1) ON CONFLICT(key) DO UPDATE SET window = excluded.window, count = CASE WHEN registration_rate_limits.window = excluded.window THEN registration_rate_limits.count + 1 ELSE 1 END RETURNING count').bind(rateKey,window).first();
    if(rate.count>60)return json({error:'Too many attempts. Please wait a few minutes and try again.'},429,{'Retry-After':'600'});
    const payloadHash=await hash(JSON.stringify({...value,submissionId:undefined}));
    const previous=await db.prepare('SELECT reference, payload_hash FROM registrations WHERE submission_id = ?').bind(value.submissionId).first();
    if(previous){if(previous.payload_hash!==payloadHash)return json({error:'This submission has already been used. Reopen the form to send a new application.'},409);return json({ok:true,reference:previous.reference});}
    const reference=`HTC-${crypto.randomUUID().replaceAll('-','').slice(0,12).toUpperCase()}`;
    const saved=await db.prepare('INSERT INTO registrations (submission_id, reference, payload_hash, full_name, email, role, track, team_name, consent_version, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(email) DO NOTHING RETURNING reference').bind(value.submissionId,reference,payloadHash,value.name,value.email,value.role,value.track,value.teamName,'2026-09-27-v1',new Date(now).toISOString()).first();
    ctx?.waitUntil?.(db.prepare('DELETE FROM registration_rate_limits WHERE key IN (SELECT key FROM registration_rate_limits WHERE window < ? LIMIT 100)').bind(window-288).run().catch(()=>{}));
    // Duplicate responses never expose the existing applicant's details or reference.
    return saved?json({ok:true,reference:saved.reference},201):json({ok:true,duplicate:true,message:'If this email already has an application, it has been kept. No duplicate application was created.'});
  } catch(error) {
    console.error('Registration storage unavailable',error?.name||'Error');
    return json({error:'Registration is temporarily unavailable. Your details have not been confirmed; please keep this form open and try again.'},503);
  }
}

export default {
  async fetch(request,env,ctx) {
    const path=new URL(request.url).pathname;
    if(path==='/api/registrations')return request.method==='POST'?register(request,env,ctx):json({error:'Method not allowed.'},405,{Allow:'POST'});
    if(path==='/api/health'){
      if(request.method!=='GET')return json({error:'Method not allowed.'},405);
      try {await database(env).prepare('SELECT submission_id FROM registrations LIMIT 0').all();return json({registration:'available'});}catch{return json({registration:'unavailable'},503);}
    }
    if(path.startsWith('/api/'))return json({error:'Not found.'},404);
    return env.ASSETS.fetch(request);
  }
};
