export const SITE_TIME_ZONE = 'Asia/Shanghai';

const datePartsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: SITE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const displayFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: SITE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export const siteDateParts = (date: Date) => {
  const values = new Map(datePartsFormatter.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    year: Number(values.get('year')),
    month: Number(values.get('month')),
    day: Number(values.get('day')),
  };
};

export const siteDateKey = (date: Date) => {
  const { year, month, day } = siteDateParts(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const formatSiteDate = (date: Date) => displayFormatter.format(date);
