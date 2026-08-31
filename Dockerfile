FROM node:22-bookworm-slim@sha256:83f487e0a63425e5b4d146fb5e5be574bcbe1b7b843d3ebafdd95eaf7767a7e5 AS build

WORKDIR /app

ARG SITE_URL
ARG BASE_PATH=/
ARG PREVIEW_DRAFTS=false
ARG PUBLIC_COMMENTS_PROVIDER=none
ARG PUBLIC_GISCUS_REPO=
ARG PUBLIC_GISCUS_REPO_ID=
ARG PUBLIC_GISCUS_CATEGORY=
ARG PUBLIC_GISCUS_CATEGORY_ID=
ARG PUBLIC_WALINE_SERVER_URL=
ARG PUBLIC_ANALYTICS_PROVIDER=none
ARG PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN=
ARG PUBLIC_UMAMI_SCRIPT_URL=
ARG PUBLIC_UMAMI_WEBSITE_ID=
ARG PUBLIC_WEBMENTION_ENDPOINT=
ARG PUBLIC_PERFORMANCE_ENDPOINT=

ENV SITE_URL=${SITE_URL} \
    BASE_PATH=${BASE_PATH} \
    PREVIEW_DRAFTS=${PREVIEW_DRAFTS} \
    PUBLIC_COMMENTS_PROVIDER=${PUBLIC_COMMENTS_PROVIDER} \
    PUBLIC_GISCUS_REPO=${PUBLIC_GISCUS_REPO} \
    PUBLIC_GISCUS_REPO_ID=${PUBLIC_GISCUS_REPO_ID} \
    PUBLIC_GISCUS_CATEGORY=${PUBLIC_GISCUS_CATEGORY} \
    PUBLIC_GISCUS_CATEGORY_ID=${PUBLIC_GISCUS_CATEGORY_ID} \
    PUBLIC_WALINE_SERVER_URL=${PUBLIC_WALINE_SERVER_URL} \
    PUBLIC_ANALYTICS_PROVIDER=${PUBLIC_ANALYTICS_PROVIDER} \
    PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN=${PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN} \
    PUBLIC_UMAMI_SCRIPT_URL=${PUBLIC_UMAMI_SCRIPT_URL} \
    PUBLIC_UMAMI_WEBSITE_ID=${PUBLIC_UMAMI_WEBSITE_ID} \
    PUBLIC_WEBMENTION_ENDPOINT=${PUBLIC_WEBMENTION_ENDPOINT} \
    PUBLIC_PERFORMANCE_ENDPOINT=${PUBLIC_PERFORMANCE_ENDPOINT}

RUN apt-get update \
    && apt-get install --yes --no-install-recommends fontconfig fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@11.19.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN node -e "const value = process.env.SITE_URL; let url; try { url = new URL(value); } catch { process.exit(1); } if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash || ['localhost', '127.0.0.1', 'example.com'].includes(url.hostname)) process.exit(1);" \
    && pnpm build

FROM nginxinc/nginx-unprivileged:1.30-alpine@sha256:45ce1e2e699234253d1def7baa96218a5d00b498d1ba0cbb1a17b6bdf73d1351 AS runtime

LABEL org.opencontainers.image.title="win98的小站" \
      org.opencontainers.image.description="Astro static personal portal served by unprivileged NGINX" \
      org.opencontainers.image.source="https://github.com/o-1717986918/win98-blog" \
      org.opencontainers.image.licenses="UNLICENSED"

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist/ /usr/share/nginx/html/

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --spider http://127.0.0.1:8080/healthz || exit 1
