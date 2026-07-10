#!/usr/bin/env sh
set -eu

echo "Running migrations, course seed, and learning-path seed..."
npm run seed:sync
echo "Catalog sync complete. Expect 23 published courses and 6 learning paths."
