# Database Migrations & Seeds

## Directory Structure

```
db/
├── migrations/          SQL migration files (schema changes)
├── seeds/              Data seed files (master data, test data)
└── README.md           This file
```

## Running Migrations

### Option 1: Supabase Dashboard (Recommended for development)
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of migration file
3. Execute in order (check filename timestamps)

### Option 2: Supabase CLI
```bash
supabase db push
```

### Option 3: Direct psql
```bash
psql -h <host> -U <user> -d <database> -f db/migrations/<filename>.sql
```

## Migration Order

Migrations must run in chronological order (filename timestamp):
1. `20260329_create_provinces_cities.sql` - Creates provinces and cities tables
2. `20260329_create_properties.sql` - Creates properties table (depends on #1)

## Running Seeds

Seeds in `db/seeds/` are TypeScript scripts using the Supabase client.

```bash
npx ts-node db/seeds/seed_indonesia_regions.ts
```

Ensure environment variables are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY`

## Verification

After running migrations, verify with:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema='public' 
ORDER BY table_name;
```

Expected tables: `provinces`, `cities`, `properties`, `profiles`, `email_verifications`
