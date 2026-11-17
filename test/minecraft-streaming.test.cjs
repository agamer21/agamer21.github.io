const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('assets/arcade/ports/minecraft-story-mode/parts.js','utf8');
function setup(fetch, disk) {
 const context={fetch, navigator:{deviceMemory:4}, Response, AbortSignal, Uint8Array,Map,Number,Error,Promise,setTimeout,caches:disk};
 vm.runInNewContext(source,context);return context.MCSMParts;
}
const bytes=new Uint8Array(20*1024*1024);bytes[0]=42;
test('deduplicates readers and retries HTTP failure and truncated data',async()=>{
 let calls=0;const policies=[];
 const parts=setup(async(url,options)=>{policies.push(options.cache);calls++;if(calls===1)return new Response('',{status:503});if(calls===2)return new Response(new Uint8Array(9));return new Response(bytes)});
 const [a,b]=await Promise.all([parts.read(0),parts.read(0)]);
 assert.deepEqual(policies,['force-cache','reload','reload']);assert.equal(calls,3);assert.equal(a,b);assert.equal(a[0],42);
 await parts.read(0);assert.equal(calls,3);
});
test('limits concurrent transfers and reuses disk data after memory eviction',async()=>{
 let active=0,max=0,calls=0;const stored=new Map();
 const disk={open:async()=>({match:async url=>stored.get(url)?.clone(),put:async(url,response)=>stored.set(url,response),keys:async()=>[...stored.keys()],delete:async url=>stored.delete(url)})};
 const parts=setup(async()=>{calls++;active++;max=Math.max(max,active);await new Promise(r=>setTimeout(r,10));active--;return new Response(bytes)},disk);
 await Promise.all([0,1,2,3,4].map(i=>parts.read(i)));
 assert(max<=2);assert.equal(calls,5);await parts.read(0);assert.equal(calls,5);
});
test('rejects bad indices and allows a fresh request after all retries fail',async()=>{
 let calls=0,working=false;
 const parts=setup(async()=>{calls++;if(!working)throw new Error('offline');return new Response(bytes)});
 await assert.rejects(parts.read(-1));assert.equal(calls,0);
 await assert.rejects(parts.read(7),/offline/);assert.equal(calls,3);
 working=true;assert.equal((await parts.read(7))[0],42);assert.equal(calls,4);
});
test('startup prefetch remains bounded for an oversized group',()=>{
 const context={Map,Uint8Array,URLSearchParams};
 vm.runInNewContext(fs.readFileSync('assets/arcade/ports/minecraft-story-mode/filesystem.js','utf8'),context);
 const reader=context.MCSMFiles;reader.blockLimit=3072;
 let pulled;reader.pull=(offset,items)=>{pulled={offset,items}};
 const group={offset:123,items:Array.from({length:3300},()=>({length:262144}))};
 reader.stream(group);
 assert.equal(pulled.offset,123);assert.equal(pulled.items.length,1024);
 assert.equal(pulled.items.reduce((n,item)=>n+item.length,0),256*1024*1024);
 assert.equal(group.started,true);
});
