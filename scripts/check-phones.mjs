import { createClient } from '@libsql/client';
const c = createClient({ url: 'file:data/teenwork.db' });
const r = await c.execute("SELECT id,role,phone,full_name FROM users WHERE phone IN ('+79009990000','+79001110000')");
for (const x of r.rows) {
  console.log(String(x.role), String(x.phone), x.full_name, x.id);
}
c.close();
