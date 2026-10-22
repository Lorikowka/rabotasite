import { createClient } from '@libsql/client';
const c = createClient({ url: 'file:data/teenwork.db' });
const t = await c.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'");
console.log(t.rows[0]?.sql ?? 'nope');
const r = await c.execute('SELECT role, phone, full_name FROM users ORDER BY created_at');
for (const x of r.rows) {
  console.log(String(x.role).padEnd(12), String(x.phone).padEnd(16), x.full_name);
}
c.close();
