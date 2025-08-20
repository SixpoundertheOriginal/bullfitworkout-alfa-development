import test from 'node:test';
import assert from 'node:assert';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;
const testUser = process.env.TEST_USER_ID;

if (!url || !serviceKey || !anonKey || !testUser) {
  test.skip('RLS tests skipped due to missing env vars', () => {});
} else {
  const admin = createClient(url, serviceKey);
  const anon = createClient(url, anonKey);

  test('service role can read all user rows', async () => {
    const { data, error } = await admin
      .from('workout_sessions')
      .select('id')
      .eq('user_id', testUser);
    assert.ifError(error);
    const count = data.length;
    const { count: exactCount, error: countErr } = await admin
      .from('workout_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', testUser);
    assert.ifError(countErr);
    assert.equal(count, exactCount);
  });

  test('anon role is restricted by RLS', async () => {
    const { data, error } = await anon
      .from('workout_sessions')
      .select('id')
      .eq('user_id', testUser);
    assert.ifError(error);
    assert.equal(data.length, 0);
  });
}
