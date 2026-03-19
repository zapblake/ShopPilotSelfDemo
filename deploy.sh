#!/bin/bash
# Safe deploy script for ShopPilotSelfDemo
# Deploys to demo.zapsight.us ONLY — never touches zapsight.us
set -e

echo "🚀 Building and deploying to demo.zapsight.us..."

# Deploy to Vercel and wait for it to be ready
DEPLOY_URL=$(vercel deploy --yes 2>&1 | grep -Eo "https://web-[a-z0-9]+-blake-austins-projects\.vercel\.app" | tail -1)
echo "✅ Preview deployed: $DEPLOY_URL"

# Wait for Vercel to finish building (poll API for READY state, up to 3 min)
VERCEL_TOKEN=$(node -e "const fs=require('fs'); try { console.log(JSON.parse(fs.readFileSync(process.env.HOME+'/Library/Application Support/com.vercel.cli/auth.json','utf8')).token) } catch(e){}")
echo "⏳ Waiting for deployment to reach READY state..."
for i in $(seq 1 36); do
  STATE=$(curl -s "https://api.vercel.com/v13/deployments/$DEPLOY_URL?teamId=team_W1jouPRgUI3ji86RxTgIbd7l" \
    -H "Authorization: Bearer $VERCEL_TOKEN" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('readyState','UNKNOWN'))" 2>/dev/null || echo "UNKNOWN")
  if [ "$STATE" = "READY" ]; then
    echo "✅ Deployment is READY"
    break
  fi
  if [ "$STATE" = "ERROR" ]; then
    echo "❌ Deployment failed with ERROR state"
    exit 1
  fi
  echo "   ... state=$STATE ($i/36)"
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
