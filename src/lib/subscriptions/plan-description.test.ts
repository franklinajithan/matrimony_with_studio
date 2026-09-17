import { strict as assert } from 'node:assert';import { orderedPlans } from './catalogue';for(const p of orderedPlans()){assert.ok(p.name.length>0);assert.ok(p.description.length>0);}
