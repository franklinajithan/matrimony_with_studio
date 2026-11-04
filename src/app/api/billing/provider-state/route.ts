import {NextResponse} from 'next/server';
export async function GET(){return NextResponse.json({provider:'tide',configured:false,checkoutEnabled:false,webhookEnabled:false,portalEnabled:false},{headers:{'Cache-Control':'no-store'}});}
