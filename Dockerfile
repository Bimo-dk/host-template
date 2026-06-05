# syntax=docker/dockerfile:1.7
# ============================================================================
# host-template — Bimo-Nexus layout shell
# Bruger BuildKit secrets så NODE_AUTH_TOKEN IKKE leakes i build-logs.
# ============================================================================

FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json .npmrc ./

RUN --mount=type=secret,id=node_auth_token,required=true \
    NODE_AUTH_TOKEN=$(cat /run/secrets/node_auth_token) \
    npm install --no-audit --no-fund --legacy-peer-deps

ARG NEXUS_TOKEN=dev-token-change-in-production
COPY tsconfig*.json angular.json federation.config.js ./
COPY src ./src
COPY public ./public

RUN node -e "const fs=require('fs'); const p='src/environments/environment.prod.ts'; let c=fs.readFileSync(p,'utf8'); c=c.replace('NEXUS_TOKEN_PLACEHOLDER', process.env.NEXUS_TOKEN || 'dev-token'); fs.writeFileSync(p,c);" \
  NEXUS_TOKEN=${NEXUS_TOKEN}

RUN npm run build:prod

FROM nginx:alpine
RUN apk add --no-cache wget curl jq

COPY --from=builder /app/dist/host/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
