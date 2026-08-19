import { cn } from '../../utils/cn';

/**
 * Section heading with optional eyebrow label and description.
 */
export default function SectionHeading({ eyebrow, title, description, align = 'left', className }) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-widest text-brand-500">{eyebrow}</p>
      )}
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-base leading-relaxed text-gray-500">{description}</p>
      )}
    </div>
  );
}
