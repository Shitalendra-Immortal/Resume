/**
 * Backend diagnostics — run with:  node diagnose.js
 * Checks your .env, MongoDB connection string format, DNS and database
 * connectivity, and prints actionable fixes. Your password is never printed.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns').promises;

const maskUri = (uri) => {
  if (!uri) return '(not set)';
  // Replace password with *** — never print credentials
  return uri.replace(/^(mongodb(?:\+srv)?:\/\/[^:/?#@]+:)([^@/?#]*)(@.+)$/, '$1***$3');
};

const checks = [];
const ok = (name, detail = '') => { checks.push({ name, status: 'OK', detail }); console.log(`✅ ${name}${detail ? ' — ' + detail : ''}`); };
const fail = (name, detail = '') => { checks.push({ name, status: 'FAIL', detail }); console.log(`❌ ${name}${detail ? ' — ' + detail : ''}`); };
const warn = (name, detail = '') => { checks.push({ name, status: 'WARN', detail }); console.log(`⚠️  ${name}${detail ? ' — ' + detail : ''}`); };

(async () => {
  console.log('\n🔍 Portfolio backend diagnostics\n');

  // 1. .env / MONGODB_URI present
  const uri = process.env.MONGODB_URI;
  if (!uri) { fail('MONGODB_URI is set', 'Missing in .env — copy .env.example to .env and fill it in'); process.exit(1); }
  ok('MONGODB_URI is set', maskUri(uri));

  // 2. URI parses correctly
  const m = uri.match(/^(mongodb(?:\+srv)?:\/\/)([^:/?#@]+):([^@/?#]*)@([^/?#]+)\/?([^?]*)/);
  if (!m) { fail('Connection string format', 'Could not parse — expected mongodb+srv://username:password@host/db'); process.exit(1); }
  const [, , user, pass, host] = m;
  ok('Connection string format', `user="${user}", host="${host}"`);

  // 3. Password needs URL-encoding?
  if (/[@:/?#[\]]/.test(pass)) {
    fail('Password URL-encoding', 'Your password contains special characters that must be percent-encoded (e.g. @ → %40). The server now auto-encodes this, but updating .env is safer.');
  } else {
    ok('Password URL-encoding', 'no special characters that break parsing');
  }

  // 4. DNS SRV lookup (for +srv URIs)
  if (uri.startsWith('mongodb+srv://')) {
    try {
      const records = await dns.resolveSrv(`_mongodb._tcp.${host}`);
      ok('DNS SRV lookup', `found ${records.length} record(s)`);
    } catch (e) {
      fail('DNS SRV lookup', `${e.code || e.message} — cluster hostname may be wrong, or the cluster was deleted/paused`);
    }
  }

  // 5. Actual connection attempt
  console.log('\n⏳ Attempting MongoDB connection (10s timeout)...');
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
    ok('MongoDB connection', `connected to database "${mongoose.connection.name}"`);
    await mongoose.disconnect();
  } catch (e) {
    const msg = e.message || String(e);
    fail('MongoDB connection', msg);
    console.log('\n💡 Most likely causes:');
    if (/authentication failed|bad auth/i.test(msg)) {
      console.log('   1. Wrong username/password in .env — reset the DB user password in Atlas → Database Access.');
      console.log('   2. Your IP is not whitelisted — Atlas → Network Access → add your IP (or 0.0.0.0/0 for testing).');
    } else if (/EREFUSED|ENOTFOUND|querySrv/i.test(msg)) {
      console.log('   1. Cluster hostname is wrong or the cluster was deleted/paused — check Atlas → Database.');
      console.log('   2. No internet / DNS blocked on this network.');
    } else if (/timed out|server selection/i.test(msg)) {
      console.log('   1. IP not whitelisted in Atlas → Network Access.');
      console.log('   2. Cluster is paused (free-tier clusters pause after inactivity) — resume it in Atlas.');
    } else {
      console.log('   - Check the error above; verify the connection string in Atlas → Database → Connect.');
    }
  }

  // 6. Other required env vars
  console.log('');
  ['JWT_SECRET', 'EMAIL_USER', 'EMAIL_PASS', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'].forEach((k) => {
    if (process.env[k]) ok(`${k} is set`); else warn(`${k} is set`, 'missing — some features (email/admin login) will not work');
  });

  const failed = checks.filter((c) => c.status === 'FAIL').length;
  console.log(`\n${failed ? '🔴' : '🟢'} Done: ${checks.length - failed}/${checks.length} checks passed.\n`);
  process.exit(failed ? 1 : 0);
})();
