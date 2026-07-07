import type { ReactNode } from "react";

type FeatureBadgeProps = {
    icon: ReactNode,
    label: string,
}
export const FeatureBadge = ({ icon, label }: FeatureBadgeProps) => {
    return (
        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-md">
            <span className="text-cyan-100">{icon}</span>
            <span>{label}</span>
        </div>
    );
}