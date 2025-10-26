import { ReactNode } from 'react';

interface ProfileViewCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export default function ProfileViewCard({ title, children, className = '' }: ProfileViewCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

interface ProfileFieldProps {
  label: string;
  value?: string | number | boolean | null;
  children?: ReactNode;
  className?: string;
}

export function ProfileField({ label, value, children, className = '' }: ProfileFieldProps) {
  const displayValue = () => {
    if (children) return children;
    if (value === null || value === undefined || value === '') return 'Not specified';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return value;
  };

  return (
    <div className={`mb-4 ${className}`}>
      <dt className="text-sm font-medium text-gray-500 mb-1">{label}</dt>
      <dd className="text-sm text-gray-900">{displayValue()}</dd>
    </div>
  );
}

interface ProfileTagsProps {
  label: string;
  tags: string[];
  className?: string;
}

export function ProfileTags({ label, tags, className = '' }: ProfileTagsProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <dt className="text-sm font-medium text-gray-500 mb-2">{label}</dt>
      <dd className="flex flex-wrap gap-2">
        {tags.length > 0 ? (
          tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
            >
              {tag}
            </span>
          ))
        ) : (
          <span className="text-sm text-gray-500">None specified</span>
        )}
      </dd>
    </div>
  );
}

interface ProfileLinkProps {
  label: string;
  url?: string;
  className?: string;
}

export function ProfileLink({ label, url, className = '' }: ProfileLinkProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <dt className="text-sm font-medium text-gray-500 mb-1">{label}</dt>
      <dd className="text-sm">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 hover:text-purple-800 underline"
          >
            {url}
          </a>
        ) : (
          <span className="text-gray-500">Not provided</span>
        )}
      </dd>
    </div>
  );
}

interface ProfileSectionProps {
  title: string;
  items: Array<{
    title?: string;
    subtitle?: string;
    description?: string;
    year?: string;
    url?: string;
  }>;
  className?: string;
}

export function ProfileSection({ title, items, className = '' }: ProfileSectionProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <dt className="text-sm font-medium text-gray-500 mb-3">{title}</dt>
      <dd>
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="border-l-2 border-purple-200 pl-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {item.title && (
                      <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
                    )}
                    {item.subtitle && (
                      <p className="text-sm text-gray-600">{item.subtitle}</p>
                    )}
                    {item.description && (
                      <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                    )}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-600 hover:text-purple-800 underline mt-1 inline-block"
                      >
                        View Certificate
                      </a>
                    )}
                  </div>
                  {item.year && (
                    <span className="text-xs text-gray-500 ml-2">{item.year}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-sm text-gray-500">None added</span>
        )}
      </dd>
    </div>
  );
}
