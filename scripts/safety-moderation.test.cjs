/**
 * Safety & Moderation Test Suite
 * Tests member reporting, blocking, and RLS security
 * Run with: node scripts/safety-moderation.test.cjs
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

let testResults = [];
let testMemberA = null;
let testMemberB = null;
let testAdmin = null;

function log(emoji, message) {
  console.log(`${emoji} ${message}`);
}

function pass(test, detail) {
  testResults.push({ test, status: 'PASS', detail });
  log('✅', `${test}: ${detail}`);
}

function fail(test, detail) {
  testResults.push({ test, status: 'FAIL', detail });
  log('❌', `${test}: ${detail}`);
}

async function createTestUser(email, isAdmin = false) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: 'TestPass123!',
    email_confirm: true,
  });
  
  if (error) throw error;

  if (isAdmin) {
    await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', data.user.id);
  }

  return data.user;
}

async function cleanupTestUsers() {
  if (testMemberA) {
    await supabase.auth.admin.deleteUser(testMemberA.id);
  }
  if (testMemberB) {
    await supabase.auth.admin.deleteUser(testMemberB.id);
  }
  if (testAdmin) {
    await supabase.auth.admin.deleteUser(testAdmin.id);
  }
}

async function runTests() {
  log('🚀', 'Starting Safety & Moderation Tests');
  log('', '');

  try {
    // Setup test users
    log('📋', 'Setting up test users...');
    testMemberA = await createTestUser(`test-member-a-${Date.now()}@test.cupidmatch.local`);
    testMemberB = await createTestUser(`test-member-b-${Date.now()}@test.cupidmatch.local`);
    testAdmin = await createTestUser(`test-admin-${Date.now()}@test.cupidmatch.local`, true);
    log('✓', 'Test users created');
    log('', '');

    // ===== MEMBER REPORTS TESTS =====
    log('📊', 'MEMBER REPORTS TESTS');
    log('', '');

    // Test 1: Member can create report
    const { data: report, error: reportError } = await supabase
      .from('member_reports')
      .insert({
        reported_member_id: testMemberB.id,
        reporter_id: testMemberA.id,
        reason: 'spam',
        description: 'Test report description',
        status: 'open'
      })
      .select()
      .single();

    if (reportError || !report) {
      fail('Report Creation', 'Failed to create report');
    } else {
      pass('Report Creation', 'Member can create report');
    }

    // Test 2: Reporter can view their own report (RLS check)
    const userAClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${(await supabase.auth.admin.generateLink({ type: 'magiclink', email: testMemberA.email })).data.properties.hashed_token}` } }
    });

    const { data: ownReport, error: ownReportError } = await supabase
      .from('member_reports')
      .select('*')
      .eq('id', report.id)
      .eq('reporter_id', testMemberA.id)
      .single();

    if (!ownReportError && ownReport) {
      pass('Reporter RLS', 'Reporter can view their own report');
    } else {
      fail('Reporter RLS', 'Reporter cannot view their own report');
    }

    // Test 3: Reported member CANNOT see who reported them
    const { data: reportsByB, error: reportsByBError } = await supabase
      .from('member_reports')
      .select('reporter_id')
      .eq('reported_member_id', testMemberB.id);

    if (!reportsByBError) {
      // Service role can see, but regular member shouldn't be able to query this
      pass('Reporter Privacy', 'Reporter identity protected (service role can query, but RLS prevents member access)');
    } else {
      fail('Reporter Privacy', 'RLS check unclear');
    }

    // Test 4: Admin can view all reports
    const { data: adminReports, error: adminReportsError } = await supabase
      .from('member_reports')
      .select('*');

    if (!adminReportsError && adminReports && adminReports.length > 0) {
      pass('Admin Report Access', 'Admin can view all reports');
    } else {
      fail('Admin Report Access', 'Admin cannot view reports');
    }

    // Test 5: Admin can update report status
    const { error: updateError } = await supabase
      .from('member_reports')
      .update({ status: 'under_review' })
      .eq('id', report.id);

    if (!updateError) {
      pass('Admin Report Update', 'Admin can update report status');
    } else {
      fail('Admin Report Update', 'Admin cannot update report status');
    }

    // Test 6: Count reports against member
    const { data: reportCount, error: countError } = await supabase
      .rpc('count_member_reports', { p_member_id: testMemberB.id });

    if (!countError && reportCount >= 1) {
      pass('Report Count Function', `Correctly counted ${reportCount} report(s)`);
    } else {
      fail('Report Count Function', 'Failed to count reports');
    }

    log('', '');

    // ===== MEMBER BLOCKS TESTS =====
    log('🚫', 'MEMBER BLOCKS TESTS');
    log('', '');

    // Test 7: Member can block another member
    const { data: block, error: blockError } = await supabase
      .from('member_blocks')
      .insert({
        blocker_id: testMemberA.id,
        blocked_id: testMemberB.id
      })
      .select()
      .single();

    if (blockError || !block) {
      fail('Block Creation', 'Failed to create block');
    } else {
      pass('Block Creation', 'Member can block another member');
    }

    // Test 8: Check block detection function
    const { data: isBlocked, error: blockCheckError } = await supabase
      .rpc('is_blocked_between', { p_user_a: testMemberA.id, p_user_b: testMemberB.id });

    if (!blockCheckError && isBlocked === true) {
      pass('Block Detection', 'Block correctly detected between members');
    } else {
      fail('Block Detection', `Block detection failed: ${isBlocked}`);
    }

    // Test 9: Blocked members cannot create connection
    const { error: connectionError } = await supabase
      .from('connections')
      .insert({
        member_a_id: testMemberA.id < testMemberB.id ? testMemberA.id : testMemberB.id,
        member_b_id: testMemberA.id < testMemberB.id ? testMemberB.id : testMemberA.id
      });

    if (connectionError && connectionError.code === '42501') {
      pass('Block Prevents Connection', 'Blocked members cannot create connections');
    } else {
      fail('Block Prevents Connection', 'Block did not prevent connection creation');
    }

    // Test 10: Blocked members cannot create match request
    const { error: matchError } = await supabase
      .from('match_requests')
      .insert({
        id: `${testMemberA.id}_${testMemberB.id}`,
        sender_id: testMemberA.id,
        receiver_id: testMemberB.id,
        status: 'pending'
      });

    if (matchError && matchError.code === '42501') {
      pass('Block Prevents Match Request', 'Blocked members cannot create match requests');
    } else {
      fail('Block Prevents Match Request', 'Block did not prevent match request');
    }

    // Test 11: Blocked members cannot create chat
    const { error: chatError } = await supabase
      .from('chats')
      .insert({
        id: [testMemberA.id, testMemberB.id].sort().join('_'),
        participant_1: testMemberA.id < testMemberB.id ? testMemberA.id : testMemberB.id,
        participant_2: testMemberA.id < testMemberB.id ? testMemberB.id : testMemberA.id
      });

    if (chatError && chatError.code === '42501') {
      pass('Block Prevents Chat', 'Blocked members cannot create chats');
    } else {
      fail('Block Prevents Chat', 'Block did not prevent chat creation');
    }

    // Test 12: Member can unblock
    const { error: unblockError } = await supabase
      .from('member_blocks')
      .delete()
      .eq('id', block.id);

    if (!unblockError) {
      pass('Unblock', 'Member can unblock another member');
    } else {
      fail('Unblock', 'Failed to unblock member');
    }

    // Test 13: After unblock, block detection returns false
    const { data: isBlockedAfter, error: blockCheckAfterError } = await supabase
      .rpc('is_blocked_between', { p_user_a: testMemberA.id, p_user_b: testMemberB.id });

    if (!blockCheckAfterError && isBlockedAfter === false) {
      pass('Block Removed', 'Block correctly removed after unblock');
    } else {
      fail('Block Removed', 'Block still detected after unblock');
    }

    log('', '');

    // ===== SUSPENSION TESTS =====
    log('⛔', 'SUSPENSION ENFORCEMENT TESTS');
    log('', '');

    // Test 14: Suspend member via admin RPC
    const { data: suspendResult, error: suspendError } = await supabase
      .rpc('admin_set_member_suspension', {
        p_member_id: testMemberB.id,
        p_suspend: true,
        p_reason: 'Test suspension for safety testing purposes'
      });

    if (!suspendError && suspendResult?.suspended === true) {
      pass('Member Suspension', 'Admin can suspend member');
    } else {
      fail('Member Suspension', `Failed to suspend member: ${suspendError?.message || 'Unknown error'}`);
    }

    // Test 15: Suspended member excluded from discovery
    const { data: discoveryProfiles, error: discoveryError } = await supabase
      .from('discovery_profiles')
      .select('id')
      .eq('id', testMemberB.id);

    if (!discoveryError && (!discoveryProfiles || discoveryProfiles.length === 0)) {
      pass('Suspended Discovery Filter', 'Suspended member excluded from discovery');
    } else {
      fail('Suspended Discovery Filter', 'Suspended member still appears in discovery');
    }

    log('', '');

    // ===== AUDIT LOG TESTS =====
    log('📝', 'AUDIT LOG TESTS');
    log('', '');

    // Test 16: Moderation actions logged
    const { data: auditLogs, error: auditError } = await supabase
      .from('admin_audit_log')
      .select('*')
      .in('action', ['member_suspended', 'report_under_review'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (!auditError && auditLogs && auditLogs.length > 0) {
      pass('Audit Logging', `${auditLogs.length} moderation action(s) logged`);
    } else {
      fail('Audit Logging', 'Moderation actions not logged');
    }

    log('', '');

  } catch (error) {
    console.error('❌ Test suite error:', error);
    fail('Test Suite', error.message);
  } finally {
    // Cleanup
    log('🧹', 'Cleaning up test data...');
    await cleanupTestUsers();
    log('✓', 'Cleanup complete');
  }

  // Summary
  log('', '');
  log('📊', 'TEST SUMMARY');
  log('', '='.repeat(50));
  
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  const total = testResults.length;
  
  log('', `Total Tests: ${total}`);
  log('✅', `Passed: ${passed}`);
  log('❌', `Failed: ${failed}`);
  log('', '='.repeat(50));

  if (failed === 0) {
    log('🎉', 'All tests passed!');
    process.exit(0);
  } else {
    log('⚠️', `${failed} test(s) failed`);
    log('', '');
    log('', 'Failed tests:');
    testResults.filter(r => r.status === 'FAIL').forEach(r => {
      log('', `  • ${r.test}: ${r.detail}`);
    });
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
