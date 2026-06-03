# ============================================================================
# host-template — Bimo-Nexus layout shell
# Bygges fra repoets EGEN rod, pakker fra GitHub Packages.
# ============================================================================

FROM node:22-alpine AS builder
WORKDIR /app

ARG NODE_AUTH_TOKEN
COPY package*.json .npmrc ./
RUN if [ -z "$NODE_AUTH_TOKEN" ]; then echo "NODE_AUTH_TOKEN build-arg er paakraevet"; exit 1; fi && \
    NODE_AUTH_TOKEN=${NODE_AUTH_TOKEN} npm install --no-audit --no-fund --legacy-peer-deps

ARG NEXUS_TOKEN=dev-token-change-in-production
COPY tsconfig*.json angular.json federation.config.js ./
COPY src ./src
COPY public ./public

RUN node -e "const fs=require('fs'); const p='src/environments/environment.prod.ts'; let c=fs.readFileSync(p,'utf8'); c=c.replace('NEXUS_TOKEN_PLACEHOLDER', process.env.NEXUS_TOKEN || 'dev-token'); fs.writeFileSync(p,c);" \
  NEXUS_TOKEN=${NEXUS_TOKEN}

RUN npm run build:prod

FROM nginx:alpine
RUN apk add --no-cache wget

COPY --from=builder /app/dist/host/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
