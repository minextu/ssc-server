FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

USER node
WORKDIR /app

# Dependencies
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# Building
FROM base AS build
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build
    
# Run
FROM base AS runner
ENV NODE_ENV=production

COPY --chown=node:node --from=build /app/dist /app/dist
COPY --chown=node:node --from=prod-deps /app/package.json /app/package.json
COPY --chown=node:node --from=prod-deps /app/node_modules /app/node_modules

RUN corepack pack

CMD ["pnpm", "start"]