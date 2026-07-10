import dataSource from '../src/database/data-source';

async function main() {
  await dataSource.initialize();
  const users = await dataSource.query(
    "SELECT email, role, is_active FROM users WHERE role IN ('admin','super_admin','staff') ORDER BY role",
  );
  console.log('ADMIN USERS:', JSON.stringify(users, null, 2));

  const migration = await dataSource.query('SELECT name FROM migrations ORDER BY id DESC LIMIT 10');
  console.log('RECENT MIGRATIONS:', JSON.stringify(migration, null, 2));

  const columns = await dataSource.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'student_profiles' AND column_name LIKE 'portal%'",
  );
  console.log('PORTAL COLUMNS:', JSON.stringify(columns, null, 2));

  await dataSource.destroy();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
