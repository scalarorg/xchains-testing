## Sub-module

This service is currently working with `xchains-bitcoin-ts` branch `xchains-testing-build`

```
git clone https://github.com/scalarorg/xchains-bitcoin-ts -b xchains-testing-build
```

## Running in dev mode

Duplicate and define `.env.local` from `.env.example`

```
docker compose up -d xchains_testing_postgres
npx prisma migrate deploy
npm run dev
```

## Building docker

Duplicate and define `.env.production.local` from `.env.production.example`

```
docker build -t scalarorg/xchains-testing .
docker compose up -d
```
