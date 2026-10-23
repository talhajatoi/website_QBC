const iconPaths = {
  facebook: <path d="M13.4 21v-8h2.7l.4-3.1h-3.1V8c0-.9.3-1.5 1.6-1.5h1.7V3.7c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.2V13H10v8h3.4Z" />,
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17.5" cy="6.7" r="1.2" /></>,
  tiktok: <path d="M16.6 3c.3 2.2 1.5 3.5 3.4 3.7v3.2c-1.4.1-2.7-.4-3.9-1.2v6.8c0 3.4-2.6 5.5-5.8 5.5-2.9 0-5.3-1.9-5.3-4.8 0-3.2 2.8-5.4 6.3-4.9v3.3c-1.8-.5-3.2.2-3.2 1.6 0 1 .8 1.7 1.9 1.7 1.2 0 2.4-.8 2.4-2.8V3h4.2Z" />,
  youtube: <><rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 5 3-5 3V9Z" fill="white" /></>,
};

const socialNames = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

export default function SocialIcon({ platform, className = 'h-5 w-5' }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      role="img"
      aria-label={socialNames[platform] || 'Social media'}
    >
      {iconPaths[platform]}
    </svg>
  );
}
