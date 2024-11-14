## Sub-module

This `xchains-testing` app is already available to be built.

To test bitcoin-vault in dev mode

```
git clone https://github.com/scalarorg/bitcoin-vault -b info/readme-and-test-results
cd bitcoin-vault/binding
bun i
bun run build
bun link
cd ../..
bun link @scalarorg/bitcoin-vault
```

## Running in dev mode

Duplicate and define `.env.local` from `.env.example`

```
docker compose up -d xchains-testing-postgres
npx prisma migrate deploy
bun run dev
```

To clean up the DB

```
docker compose down -v
```

## Building docker

Duplicate and define `.env.production.local` from `.env.production.example`

```
docker build -t scalarorg/xchains-testing .
docker compose up -d
```
