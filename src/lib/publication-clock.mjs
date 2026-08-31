const key = 'SOMEONE_SITE_BUILD_TIMESTAMP';
const configured = process.env[key];
const parsed = configured ? Date.parse(configured) : Date.now();

if (Number.isNaN(parsed)) throw new Error(`${key} must be a valid date or timestamp`);
if (!configured) process.env[key] = new Date(parsed).toISOString();

export const publicationTimestamp = parsed;
