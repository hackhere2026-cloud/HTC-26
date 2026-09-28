import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import worker,{register} from '../server/index.js';

function fixture(){
  const sqlite=new DatabaseSync(':memory:');
  for(const file of readdirSync('drizzle').filter(file=>file.endsWith('.sql')).sort())sqlite.exec(readFileSync(`drizzle/${file}`,'utf8'));
  const DB={prepare(sql){const statement=sqlite.prepare(sql);let values=[];return {bind(...args){values=args;return this;},async first(){return statement.get(...values)||null;},async all(){return {results:statement.all(...values)};},async run(){statement.run(...values);return {success:true};}};}};
  return {sqlite,env:{DB},ctx:{waitUntil(promise){promise.catch(()=>{});}}};
}
const application=()=>({submissionId:crypto.randomUUID(),name:"Test D'Angelo",email:'test@example.com',role:'Engineering',track:'ai',teamName:'Test team',consent:true,website:''});
const request=(body,headers={})=>new Request('https://example.test/api/registrations',{method:'POST',headers:{Origin:'https://example.test','Content-Type':'application/json','cf-connecting-ip':'192.0.2.1',...headers},body:JSON.stringify(body)});
const count=f=>f.sqlite.prepare('SELECT count(*) AS n FROM registrations').get().n;

test('saves a real record with a reference and normalized email',async()=>{
  const f=fixture(),value=application();value.email='TEST@Example.com';
  const result=await register(request(value),f.env,f.ctx),body=await result.json();
  assert.equal(result.status,201);assert.match(body.reference,/^HTC-[A-F0-9]{12}$/);assert.equal(count(f),1);
  const row=f.sqlite.prepare('SELECT full_name,email,consent_version FROM registrations').get();
  assert.equal(row.full_name,"Test D'Angelo");assert.equal(row.email,'test@example.com');assert.equal(row.consent_version,'2026-09-27-v1');f.sqlite.close();
});
test('retry is idempotent and mismatched reuse is rejected',async()=>{
  const f=fixture(),value=application();const first=await (await register(request(value),f.env,f.ctx)).json();
  const retry=await (await register(request(value),f.env,f.ctx)).json();assert.equal(retry.reference,first.reference);assert.equal(count(f),1);
  value.name='Changed Name';assert.equal((await register(request(value),f.env,f.ctx)).status,409);f.sqlite.close();
});
test('duplicate email neither creates another row nor reveals existing details',async()=>{
  const f=fixture();await register(request(application()),f.env,f.ctx);const result=await (await register(request(application()),f.env,f.ctx)).json();
  assert.equal(result.duplicate,true);assert.equal(result.reference,undefined);assert.equal(result.email,undefined);assert.equal(count(f),1);f.sqlite.close();
});
test('invalid fields and missing consent do not reach storage',async()=>{
  const f=fixture();for(const change of [{name:'A'},{email:'bad'},{role:'admin'},{track:'bogus'},{consent:false},{name:'X'.repeat(101)},{website:'https://bot.test'},{submissionId:'bad'}])assert.equal((await register(request({...application(),...change}),f.env,f.ctx)).status,400);
  assert.equal(count(f),0);f.sqlite.close();
});
test('cross-origin submissions are blocked',async()=>{
  const f=fixture();assert.equal((await register(request(application(),{Origin:'https://evil.test'}),f.env,f.ctx)).status,403);
  assert.equal((await register(request(application(),{'sec-fetch-site':'cross-site'}),f.env,f.ctx)).status,403);assert.equal(count(f),0);f.sqlite.close();
});
test('oversized bodies and wrong content types are rejected',async()=>{
  const f=fixture();assert.equal((await register(request({...application(),name:'x'.repeat(9000)}),f.env,f.ctx)).status,413);
  assert.equal((await register(request(application(),{'Content-Type':'text/plain'}),f.env,f.ctx)).status,415);assert.equal(count(f),0);f.sqlite.close();
});
test('excess repeated attempts are rate-limited',async()=>{
  const f=fixture(),value=application();for(let i=0;i<60;i++)await register(request(value),f.env,f.ctx);
  const result=await register(request(value),f.env,f.ctx);assert.equal(result.status,429);assert.equal(result.headers.get('Retry-After'),'600');assert.equal(count(f),1);f.sqlite.close();
});
test('database failure gives a recoverable error, never a false success',async()=>{
  const result=await register(request(application()),{},{});assert.equal(result.status,503);assert.equal((await result.json()).ok,undefined);
});
test('registrations cannot be listed through the public API',async()=>{
  const f=fixture();await register(request(application()),f.env,f.ctx);const result=await worker.fetch(new Request('https://example.test/api/registrations'),f.env,f.ctx);
  assert.equal(result.status,405);assert.equal(result.headers.get('Allow'),'POST');assert.equal((await result.text()).includes('example.com'),false);f.sqlite.close();
});
test('health checks verify the schema without exposing applicant records',async()=>{
  const f=fixture();const result=await worker.fetch(new Request('https://example.test/api/health'),f.env,f.ctx);assert.deepEqual(await result.json(),{registration:'available'});f.sqlite.close();
});
