#!/usr/bin/env bash
set -o errexit

echo "📦 Installing dependencies..."
pnpm install

echo "🔨 Building project..."
pnpm build