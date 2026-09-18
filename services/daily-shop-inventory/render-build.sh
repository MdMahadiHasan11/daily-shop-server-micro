#!/usr/bin/env bash
set -o errexit

echo "📦 Installing dependencies..."
pnpm install

echo "⚙️ Generating Prisma Client..."
npx prisma generate

echo "🚀 Running Database Migrations..."
npx prisma migrate deploy

echo "🔨 Building project..."
pnpm build