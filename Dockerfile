# ── Stage 1: build ────────────────────────────────────────────────
FROM public.ecr.aws/docker/library/node:18-alpine AS build
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ── Stage 2: runtime ──────────────────────────────────────────────
FROM public.ecr.aws/docker/library/node:18-alpine
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=build /usr/src/app/dist ./dist

EXPOSE 4001

CMD ["node", "dist/main.js"]
