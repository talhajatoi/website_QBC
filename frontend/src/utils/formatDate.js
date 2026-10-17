export const formatDate = (value) => value ? new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium' }).format(new Date(value)) : '—';
