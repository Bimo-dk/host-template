#!/bin/sh
set -e

REGISTRY_URL="${REGISTRY_URL:-http://registry:8670}"
NEXUS_TOKEN="${NEXUS_TOKEN:-dev-token}"
HOST_NAME="${HOST_NAME:-angularHost}"
HOST_PUBLIC_URL="${HOST_PUBLIC_URL:-http://${HOST_NAME}}"
HOST_REMOTE_ENTRY="${HOST_REMOTE_ENTRY:-/remoteEntry.json}"
HOST_EXPOSED_MODULE="${HOST_EXPOSED_MODULE:-./AppShell}"
FRAMEWORK="angular"

MAX_WAIT="${REGISTER_TIMEOUT:-60}"
waited=0

until curl -sf -o /dev/null "${REGISTRY_URL}/health"; do
  if [ "$waited" -ge "$MAX_WAIT" ]; then
    echo "[nexus] registry not reachable after ${MAX_WAIT}s — starting without registration"
    exec nginx -g "daemon off;"
  fi
  echo "[nexus] waiting for registry..."
  sleep 2
  waited=$((waited + 2))
done

PAYLOAD="{\"name\":\"${HOST_NAME}\",\"url\":\"${HOST_PUBLIC_URL}\",\"framework\":\"${FRAMEWORK}\",\"remoteEntry\":\"${HOST_REMOTE_ENTRY}\",\"exposedModule\":\"${HOST_EXPOSED_MODULE}\"}"

HTTP_CODE=$(curl -s -o /tmp/nexus_reg.json -w "%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-Nexus-Token: ${NEXUS_TOKEN}" \
  -d "${PAYLOAD}" \
  "${REGISTRY_URL}/api/hosts")

if [ "$HTTP_CODE" = "201" ]; then
  echo "[nexus] registered host '${HOST_NAME}'"
elif [ "$HTTP_CODE" = "409" ]; then
  HOST_ID=$(curl -sf \
    -H "X-Nexus-Token: ${NEXUS_TOKEN}" \
    "${REGISTRY_URL}/api/hosts" | \
    jq -r '.[] | select(.name == "'"${HOST_NAME}"'") | .id' | head -1)
  if [ -n "$HOST_ID" ]; then
    curl -sf -X PUT \
      -H "Content-Type: application/json" \
      -H "X-Nexus-Token: ${NEXUS_TOKEN}" \
      -d "${PAYLOAD}" \
      "${REGISTRY_URL}/api/hosts/${HOST_ID}" > /dev/null
    echo "[nexus] updated host '${HOST_NAME}' (${HOST_ID})"
  else
    echo "[nexus] warning: host '${HOST_NAME}' exists but ID not found"
  fi
else
  echo "[nexus] warning: registration returned HTTP ${HTTP_CODE}"
  cat /tmp/nexus_reg.json 2>/dev/null || true
fi

exec nginx -g "daemon off;"
