import "server-only";
import { integrationReadiness } from "@/lib/account/readiness";
/** Render only inside a server-guarded Super Admin page. */
export function IntegrationReadiness() {
  return (
    <section
      aria-labelledby="integration-readiness"
      className="space-y-3 rounded-lg border p-4"
    >
      <h2 id="integration-readiness" className="text-xl font-semibold">
        Integration setup
      </h2>
      <p className="text-sm text-muted-foreground">
        Environment checks for Super Admin. Present inputs do not verify a
        provider, database migration or successful delivery. External acceptance
        tests are still required.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {integrationReadiness(process.env).map((item) => (
          <article
            key={item.name}
            className="min-w-0 space-y-2 rounded border p-3 text-sm"
          >
            <h3 className="font-semibold">{item.name}</h3>
            <p>
              {!item.enabled
                ? "Disabled by feature flag"
                : item.configured
                  ? "Environment inputs present; verification required"
                  : "Unavailable: setup incomplete"}
            </p>
            {item.missing.length > 0 ? (
              <p className="break-words">
                Missing:{" "}
                <span className="font-mono text-xs">
                  {item.missing.join(", ")}
                </span>
              </p>
            ) : null}
            {item.invalid.length > 0 ? <p>{item.invalid.join(". ")}</p> : null}
            <p className="text-muted-foreground">
              Verify: {item.acceptanceRequired}.
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
