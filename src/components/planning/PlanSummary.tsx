import { FuturePlan, planFields } from "./client";
export function PlanSummary({ plan }: { plan: FuturePlan }) {
  return (
    <div className="space-y-4">
      <dl className="grid gap-4 sm:grid-cols-2">
        {planFields.map((f) => (
          <div key={f.key}>
            <dt className="text-sm font-semibold">{f.label}</dt>
            <dd className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
              {plan[f.key] || "Not shared"}
            </dd>
          </div>
        ))}
      </dl>
      {!!plan.milestones?.length && (
        <ul className="space-y-2">
          {plan.milestones.map((m, i) => (
            <li key={i} className="text-sm">
              {m.done ? "✓" : "○"} {m.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
