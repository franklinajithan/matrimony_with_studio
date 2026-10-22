import { copyFile } from 'node:fs/promises';
for(const file of ['deletion','recent-auth'])await copyFile(`src/lib/account/${file}.ts`,`supabase/functions/account-lifecycle/${file}.ts`);
