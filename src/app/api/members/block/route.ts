import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// POST: Block a member
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { blockedMemberId } = body as Record<string, unknown>;

  // Validate blockedMemberId
  if (typeof blockedMemberId !== "string" || !uuid.test(blockedMemberId)) {
    return NextResponse.json({ error: "Invalid member ID" }, { status: 400 });
  }

  // Cannot block yourself
  if (blockedMemberId === user.id) {
    return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
  }

  // Insert the block
  const { error } = await supabase
    .from("member_blocks")
    .insert({
      blocker_id: user.id,
      blocked_id: blockedMemberId
    });

  if (error) {
    // Handle duplicate block gracefully
    if (error.code === '23505') {
      return NextResponse.json({ 
        success: true,
        message: "Member already blocked"
      });
    }
    console.error('Error creating block:', error);
    return NextResponse.json({ error: "Unable to block member" }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true,
    message: "Member blocked successfully"
  }, { 
    status: 201,
    headers: { "Cache-Control": "no-store" } 
  });
}

// DELETE: Unblock a member
export async function DELETE(request: Request) {
  const supabase = await createSupabaseServerClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get blockedMemberId from query params
  const { searchParams } = new URL(request.url);
  const blockedMemberId = searchParams.get('memberId');

  // Validate blockedMemberId
  if (!blockedMemberId || !uuid.test(blockedMemberId)) {
    return NextResponse.json({ error: "Invalid member ID" }, { status: 400 });
  }

  // Delete the block
  const { error } = await supabase
    .from("member_blocks")
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', blockedMemberId);

  if (error) {
    console.error('Error removing block:', error);
    return NextResponse.json({ error: "Unable to unblock member" }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true,
    message: "Member unblocked successfully"
  }, {
    headers: { "Cache-Control": "no-store" }
  });
}

// GET: Get list of blocked members
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get blocks created by the current user
  const { data, error } = await supabase
    .from("member_blocks")
    .select(`
      id,
      blocked_id,
      created_at
    `)
    .eq('blocker_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching blocks:', error);
    return NextResponse.json({ error: "Unable to fetch blocked members" }, { status: 500 });
  }

  return NextResponse.json({ 
    blocks: data || [] 
  }, {
    headers: { "Cache-Control": "no-store" }
  });
}
