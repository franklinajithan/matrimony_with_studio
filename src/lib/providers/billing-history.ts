import "server-only";
import { getStripe } from "./stripe";
function safeLink(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      ["invoice.stripe.com", "pay.stripe.com"].includes(url.hostname)
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export async function billingHistory(customer: string, after?: string) {
  const result = await getStripe().invoices.list({
    customer,
    limit: 10,
    ...(after ? { starting_after: after } : {}),
  });
  const invoices = result.data.map((invoice) => {
    const owner =
      typeof invoice.customer === "string"
        ? invoice.customer
        : invoice.customer?.id;
    if (invoice.livemode || owner !== customer)
      throw new Error("Invoice ownership mismatch");
    return {
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      created: new Date(invoice.created * 1000).toISOString(),
      currency: invoice.currency,
      amountDue: invoice.amount_due,
      amountPaid: invoice.amount_paid,
      hostedUrl: safeLink(invoice.hosted_invoice_url),
      pdfUrl: safeLink(invoice.invoice_pdf),
    };
  });
  return {
    invoices,
    next: result.has_more ? invoices.at(-1)?.id || null : null,
    testMode: true,
  };
}
