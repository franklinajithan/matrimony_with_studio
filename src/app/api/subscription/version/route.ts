import { NextResponse } from 'next/server';export async function GET(){return NextResponse.json({schema:'launch-v1',plans:['free','premium','premium_plus'],currency:'GBP'});}
