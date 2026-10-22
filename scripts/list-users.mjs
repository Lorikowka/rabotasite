import { createClient } from '@libsql/client';
const c = createClient({ url: 'file:data/teenwork.db' });
const r = await c.execute('SELECT id,role,phone,fullName FROM users ORDER BY createdAt');
for (const x of r.rows) {
  console.log(String(x.role).padEnd(10), String(x.phone).padEnd(14), x.fullName);
}
c.close();
