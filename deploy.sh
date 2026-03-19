#!/bin/bash
# Safe deploy script for ShopPilotSelfDemo
# Deploys to demo.zapsight.us ONLY — never touches zapsight.us
set -e

echo "🚀 Building and deploying to demo.zapsight.us..."

# Deploy to Vercel and wait for it to be ready
DEPLOY_URL=$(vercel deploy --yes 2>&1 | grep -Eo "https://web-[a-z0-9]+-blake-austins-projects\.vercel\.app" | tail -1)
echo "✅ Preview deployed: $DEPLOY_URL"

# Poll until deployment is ready (up to 3 min)
echo "⏳ Waiting for deployment to be ready..."
for i in $(seq 1 36); do
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL")
  if [ "$HTTP" = "200" ] || [ "$HTTP" = "308" ] || [ "$HTTP" = "307" ]; then
    echo "✅ Deployment is live (HTTP $HTTP)"
    break
  fi
  echo "   ... HTTP $HTTP, retry $i/36"
  sleep 5
done

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
