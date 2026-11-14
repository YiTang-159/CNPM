import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanPriceUpdate, calculateOrderSnapshot } from '../src/pricingPolicy.js';
const good={currency:'VND',uploadMinor:25000,translationMinor:10000,maxVideos:500,maxTranslations:3,annualDiscountPct:20,version:1,reason:'Cập nhật theo chi phí vận hành'};
test('Admin pricing validator rejects invalid prices and concurrency inputs',()=>{
 assert.deepEqual(cleanPriceUpdate(good),{value:good});
 for(const item of [{...good,uploadMinor:-1},{...good,uploadMinor:'25000'},
 {...good,translationMinor:null},{...good,maxVideos:0},{...good,maxTranslations:4},
 {...good,uploadMinor:100000001},{...good,version:0},{...good,reason:''}])
 assert.ok(cleanPriceUpdate(item).error);
});
test('Previous price snapshots are immutable after changing current policy',()=>{
 const original={currency:'VND',uploadMinor:20000,translationMinor:10000,maxVideos:500,maxTranslations:3,version:1};
 const oldOrder=calculateOrderSnapshot(original,1,1);
 const latest=calculateOrderSnapshot({...original,uploadMinor:25000,version:2},1,1);
 assert.equal(oldOrder.amountMinor,30000);assert.equal(oldOrder.version,1);
 assert.equal(latest.amountMinor,35000);assert.equal(latest.version,2);
});
test('Backend enforces per-video and total usage limits',()=>{
 const p={currency:'VND',uploadMinor:20000,translationMinor:10000,maxVideos:500,maxTranslations:3,version:1};
 assert.throws(()=>calculateOrderSnapshot(p,501,1),/invalid_quantity/);
 assert.throws(()=>calculateOrderSnapshot(p,1,4),/invalid_quantity/);
 assert.equal(calculateOrderSnapshot(p,500,1500).amountMinor,25000000);
});
