/** Stripe invoice line periods are the authoritative paid service window.
 * Do not use the current subscription item period for a past paid invoice:
 * a renewed subscription can already be in a later, unpaid period.
 */
type Line = {
 period?: { start?: number; end?: number };
 pricing?: { price_details?: { price?: string } };
 price?: { id?: string } | string;
 parent?: { subscription_item_details?: { subscription?: string; proration?: boolean } };
 type?: string;
};
type Invoice = {
 lines?: { data?: Line[]; has_more?: boolean };
 parent?: { subscription_details?: { subscription?: string } };
 subscription?: string;
};
export function paidInvoicePeriod(invoice: Invoice, subscriptionId: string, priceId: string) {
 const lines=invoice.lines;
 if(!lines || lines.has_more || !Array.isArray(lines.data)) return null;
 const candidates=lines.data.filter(line => {
  const linePrice=typeof line.price==='string'?line.price:line.price?.id??line.pricing?.price_details?.price;
  const belongsToSubscription=line.parent?.subscription_item_details?.subscription;
  return linePrice===priceId && belongsToSubscription===subscriptionId &&
   line.parent?.subscription_item_details?.proration!==true;
 });
 if(candidates.length!==1)return null;
 const {start,end}=candidates[0].period??{};
 if(!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || !start || !end || end<=start)return null;
 return {start:start as number,end:end as number};
}
