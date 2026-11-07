import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { paidInvoicePeriod } from './stripe-invoice-period';

const sub='sub_verified123';
const price='price_correct123';
const line=(start:number,end:number)=>({
 pricing:{price_details:{price}},
 parent:{subscription_item_details:{subscription:sub,proration:false}},
 period:{start,end}
});
test('a paid invoice only grants the paid invoice billing period',()=>{
 const invoice={lines:{data:[line(1000,3000)],has_more:false}};
 assert.deepEqual(paidInvoicePeriod(invoice,sub,price),{start:1000,end:3000});
});
test('wrong subscription or price can never extend membership',()=>{
 const invoice={lines:{data:[line(1000,3000)],has_more:false}};
 assert.equal(paidInvoicePeriod(invoice,'sub_other123',price),null);
 assert.equal(paidInvoicePeriod(invoice,sub,'price_other123'),null);
});
test('ambiguous, truncated, prorated, and invalid invoice periods fail closed',()=>{
 assert.equal(paidInvoicePeriod({lines:{data:[line(1000,3000),line(3000,5000)]}},sub,price),null);
 assert.equal(paidInvoicePeriod({lines:{data:[line(1000,3000)],has_more:true}},sub,price),null);
 assert.equal(paidInvoicePeriod({lines:{data:[{...line(1000,3000),parent:{subscription_item_details:{subscription:sub,proration:true}}}]}},sub,price),null);
 assert.equal(paidInvoicePeriod({lines:{data:[line(3000,1000)]}},sub,price),null);
 assert.equal(paidInvoicePeriod({},sub,price),null);
});
