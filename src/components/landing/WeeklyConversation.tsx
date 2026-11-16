const questions = [
  ["An unexpected free Sunday", "A coastal walk", "Cooking together", "A useful follow-up: What would make that day feel special to you?"],
  ["A tradition to share", "A family recipe", "A festival memory", "A useful follow-up: Who taught you that tradition, and what does it mean to you?"],
  ["The first trip together", "A city neither knows", "A place from your childhood", "A useful follow-up: What is the first place you would take me there?"],
  ["A small gesture after a long day", "A cup of tea together", "A little quiet time", "A useful follow-up: How do you like someone to show up for you when you are tired?"],
  ["A skill to learn together", "A new language", "A new dance", "A useful follow-up: What would we laugh about most as beginners?"],
  ["A special celebration", "Dinner with family", "A day away together", "A useful follow-up: What makes a celebration memorable for you?"],
] as const;

const londonDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

export function WeeklyConversation() {
  const [day, month, year] = londonDate.format(new Date()).split("/").map(Number);
  // 5 January 1970 was a Monday. Work in calendar days so DST does not shift the rotation.
  const week = Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(1970, 0, 5)) / 604_800_000);
  const [title, first, second, followUp] = questions[week % questions.length];

  return (
    <section aria-labelledby="weekly-conversation-title" className="mx-auto my-12 w-full max-w-5xl px-4 sm:px-6">
      <div className="rounded-3xl border border-border bg-accent/40 p-6 sm:p-10">
        <h2 id="weekly-conversation-title" className="font-headline text-2xl font-semibold text-primary sm:text-3xl">This week's conversation starter</h2>
        <p className="mt-3 text-foreground">{title}. Which would you choose?</p>
        <div className="mt-4 grid items-start gap-3 sm:grid-cols-2">
          {[first, second].map((choice) => (
            <details key={choice} name="weekly-conversation-choice" className="rounded-2xl border border-border bg-card">
              <summary className="min-h-12 cursor-pointer touch-manipulation rounded-2xl px-4 py-3 font-semibold text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">{choice}</summary>
              <p className="px-4 pb-4 text-sm text-foreground">{followUp}</p>
            </details>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">A different question every Monday.</p>
      </div>
    </section>
  );
}
