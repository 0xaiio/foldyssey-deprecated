import { Icon } from '../components/ui';

/** Milestone-0 placeholder. Replaced by the real page in a later commit. */
export function ComingSoon({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-5 py-24 text-center">
      <p className="eyebrow mb-2">{eyebrow}</p>
      <h1 className="font-display text-[2rem] text-ink">{title}</h1>
      <p className="mt-3 max-w-md text-[0.9rem] leading-relaxed text-ink-soft">{description}</p>
      <a href="#/" className="btn btn-ghost mt-6">
        <Icon name="chevron-left" size={15} />
        回到首页
      </a>
    </div>
  );
}
