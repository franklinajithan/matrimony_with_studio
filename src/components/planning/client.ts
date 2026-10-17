export async function workspace<T>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetch("/api/workspace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      data.error || "Unable to load this workspace. Please retry.",
    );
  return data as T;
}
export type FuturePlan = {
  currentLocation?: string;
  futureLocation?: string;
  relocation?: string;
  longDistance?: string;
  career?: string;
  family?: string;
  timeline?: string;
  milestones?: { title: string; done: boolean }[];
};
export const planFields: {
  key: Exclude<keyof FuturePlan, "milestones">;
  label: string;
  hint: string;
}[] = [
  {
    key: "currentLocation",
    label: "Where you live now",
    hint: "City and country; leave out your address",
  },
  {
    key: "futureLocation",
    label: "Where you hope to settle",
    hint: "Countries or cities you would consider",
  },
  {
    key: "relocation",
    label: "Relocation",
    hint: "Openness, constraints and timing",
  },
  {
    key: "longDistance",
    label: "Long-distance relationship",
    hint: "What could work for you and for how long",
  },
  {
    key: "career",
    label: "Career and education",
    hint: "Your plans and flexibility",
  },
  {
    key: "family",
    label: "Family responsibilities",
    hint: "What you choose to share about support and living arrangements",
  },
  {
    key: "timeline",
    label: "Relationship timeline",
    hint: "Your hopes and next steps",
  },
];
