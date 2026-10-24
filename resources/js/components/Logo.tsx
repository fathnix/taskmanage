import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

export function LogoMark({
  className = 'h-9 w-9 rounded-xl',
  iconClassName = 'h-5 w-5',
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg shadow-primary-500/25 ${className}`}
    >
      <ClipboardDocumentCheckIcon className={iconClassName} aria-hidden="true" />
    </span>
  );
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="text-xl font-bold tracking-tight text-neutral-900">
        FlowTrack
      </span>
    </span>
  );
}
