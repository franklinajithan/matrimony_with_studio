import {NextResponse} from 'next/server';
export async function GET(){return NextResponse.json({billing:'disabled',provider:'tide'},{status:503,headers:{'Cache-Control':'no-store'}});}
