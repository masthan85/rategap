import { useEffect, useRef, type ReactNode } from "react";
import { ExternalLink, X } from "lucide-react";
import type { Product } from "../lib/types";

export function Panel({ title, hint, action, children }: { title?: string; hint?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="grid min-w-0 content-start gap-3 rounded-xl border border-line bg-card p-4 sm:p-5">
      {(title || action) && (
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <div className="grid gap-0.5">
            {title && <h2 className="text-lg sm:text-xl">{title}</h2>}
            {hint && <p className="text-[13px] text-muted">{hint}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "good" | "warn" | "crit" }) {
  const toneCls =
    tone === "warn" ? "border-warn bg-warn-soft" : tone === "crit" ? "border-crit bg-crit-soft" : tone === "good" ? "border-good bg-good-soft" : "border-line bg-card";
  return (
    <div className={`grid gap-0.5 rounded-xl border p-3.5 ${toneCls}`}>
      <span className="text-[13px] text-muted">{label}</span>
      <b className="num text-2xl font-semibold">{value}</b>
      {sub && <span className="text-[13px] text-muted">{sub}</span>}
    </div>
  );
}

export function Meter({ ratio, tone, label }: { ratio: number; tone?: "good" | "warn" | "crit"; label: string }) {
  const bg = tone === "crit" ? "bg-crit" : tone === "warn" ? "bg-warn" : tone === "good" ? "bg-good" : "bg-accent";
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-line" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(1, ratio) * 100)}>
      <i className={`block h-full ${bg} transition-[width] duration-300 motion-reduce:transition-none`} style={{ width: `${Math.min(100, Math.max(0, ratio * 100))}%` }} />
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="max-w-[68ch] border-l-[3px] border-line pl-2.5 text-[13px] text-muted">{children}</p>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-line p-4 text-center text-sm text-muted">{children}</p>;
}

export function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(520px,calc(100vw-32px))] rounded-2xl border border-line bg-card p-0 text-ink backdrop:bg-black/40"
    >
      <div className="grid gap-4 p-5">
        <header className="flex items-start justify-between gap-4">
          <h2 className="text-xl">{title}</h2>
          <button className="link no-underline" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}

/**
 * The MVP's only route to a provider. States the fee, that this is not
 * advice, and that the rate must be confirmed before opening.
 */
export function OpenInterstitial({ product, onClose }: { product: Product | null; onClose: () => void }) {
  return (
    <Dialog open={!!product} onClose={onClose} title={product ? `Leaving for ${product.brand}` : ""}>
      {product && (
        <>
          <p className="text-sm">
            You are going to <strong>{product.brand}</strong> to look at <strong>{product.name}</strong>
            {product.route === "platform" && product.platform ? `, offered through ${product.platform}` : ""}.
          </p>
          <ul className="grid list-disc gap-2 pl-5 text-sm">
            <li>We may earn a fee from the provider if you open and fund an account. This does not change the rate you get or the order of the rate board.</li>
            <li>This is information, not advice. The rate board ranks products only by the criteria you choose.</li>
            <li>Rates change often. Confirm the live rate, terms and FSCS protection with the provider before you open an account.</li>
          </ul>
          <div className="flex flex-wrap justify-end gap-2">
            <button className="btn btn-ghost" onClick={onClose}>Stay here</button>
            <a className="btn no-underline" href={product.url} target="_blank" rel="noopener noreferrer sponsored" onClick={onClose}>
              Continue to provider <ExternalLink size={15} />
            </a>
          </div>
        </>
      )}
    </Dialog>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm">
      <input type="checkbox" className="mt-1 size-4 accent-[var(--accent)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        {label}
        {hint && <span className="block text-[13px] text-muted">{hint}</span>}
      </span>
    </label>
  );
}
