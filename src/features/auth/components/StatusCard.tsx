type StatusCardProps = {
    label: string;
    value: string;
    tone: "success" | "danger" | "warning" | "muted";
};
export const StatusCard = ({ label, value, tone }: StatusCardProps) => {
    const styles = {
        success: "border-emerald-300/30 bg-emerald-400/15 text-emerald-50",
        danger: "border-rose-300/30 bg-rose-400/15 text-rose-50",
        warning: "border-amber-300/30 bg-amber-400/15 text-amber-50",
        muted: "border-slate-300/30 bg-slate-400/15 text-slate-50",
    };

    return (
        <div
            className={`rounded-2xl border p-4 shadow-sm backdrop-blur-md ${styles[tone]}`}
        >
            <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-75">
                {label}
            </p>
            <p className="mt-2 text-base font-bold sm:text-lg">{value}</p>
        </div>
    );
}