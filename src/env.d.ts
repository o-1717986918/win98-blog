/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PREVIEW_DRAFTS?: string;
  readonly PUBLIC_COMMENTS_PROVIDER?: 'none' | 'giscus' | 'waline';
  readonly PUBLIC_GISCUS_REPO?: string;
  readonly PUBLIC_GISCUS_REPO_ID?: string;
  readonly PUBLIC_GISCUS_CATEGORY?: string;
  readonly PUBLIC_GISCUS_CATEGORY_ID?: string;
  readonly PUBLIC_WALINE_SERVER_URL?: string;
  readonly PUBLIC_ANALYTICS_PROVIDER?: 'none' | 'cloudflare' | 'umami';
  readonly PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN?: string;
  readonly PUBLIC_UMAMI_SCRIPT_URL?: string;
  readonly PUBLIC_UMAMI_WEBSITE_ID?: string;
}

interface ImportMeta { readonly env: ImportMetaEnv; }
