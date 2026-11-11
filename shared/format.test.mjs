import test from 'node:test';
import assert from 'node:assert/strict';
import { formatMinorMoney } from './format.js';
test('VND in SQL is displayed without cent conversion',()=>assert.equal(formatMinorMoney(25000,'VND','en-US'),new Intl.NumberFormat('en-US',{style:'currency',currency:'VND',minimumFractionDigits:0,maximumFractionDigits:0}).format(25000)));
test('USD stored cents display as dollars',()=>assert.equal(formatMinorMoney(125,'USD','en-US'),'$1.25'));
test('CNY stored fen display as yuan',()=>assert.equal(formatMinorMoney(360,'CNY','en-US'),new Intl.NumberFormat('en-US',{style:'currency',currency:'CNY',minimumFractionDigits:2,maximumFractionDigits:2}).format(3.6)));
