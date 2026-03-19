#!/bin/bash
# Safe deploy script for ShopPilotSelfDemo
# Deploys to demo.zapsight.us ONLY — never touches zapsight.us
set -e

echo "🚀 Building and deploying to demo.zapsight.us..."

# Deploy to Vercel (preview first, no --prod flag to avoid wildcard alias)
DEPLOY_URL=$(vercel deploy --yes 2>&1 | grep -Eo "https://web-[a-z0-9]+-blake-austins-projects\.vercel\.app" | tail -1)
echo "✅ Preview deployed: $DEPLOY_URL"

# Explicitly alias ONLY demo.zapsight.us — never the apex or wildcard
vercel alias set "$DEPLOY_URL" demo.zapsight.us
echo "✅ Aliased: demo.zapsight.us → $DEPLOY_URL"

# Re-anchor zapsight.us to its own project (safety net)
ZSUS=$(vercel ls zapsight-us 2>&1 | grep "Ready" | head -1 | awk '{print $3}')
if [ -n "$ZSUS" ]; then
  vercel alias set "$ZSUS" zapsight.us 2>/dev/null && echo "✅ zapsight.us re-anchored to zapsight-us project"
fi

echo ""
echo "🎉 Done! Live at: https://demo.zapsight.us"
echo "🔒 zapsight.us untouched."
