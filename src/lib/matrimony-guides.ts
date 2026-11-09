export const matrimonyGuides = [
  {
    slug: "first-matrimony-call",
    title: "Questions to ask on a first matrimony call",
    description: "A practical first-call checklist for Tamil, Sri Lankan and Indian matrimony, with examples for discussing family, location and next steps.",
    intro: "The first call is a chance to find out whether you would both like another conversation. Agree on a time, decide who will join, and pick two or three topics that matter most to you.",
    sections: [
      { title: "Start with everyday life", text: "Ask what a typical week looks like and what each person enjoys outside work. If you use different languages with friends and family, ask which language they would prefer for the call. A simple opener is, ‘What does a good weekend look like for you?’" },
      { title: "Ask about plans and family involvement", text: "Try ‘Where would you like to live over the next few years?’ and ‘When would you feel ready to introduce family?’ If you have a firm preference, explain why it matters to you and give the other person time to describe their own." },
      { title: "Finish with a clear next step", text: "If you would like to speak again, suggest a time and one topic to pick up next. If you need time to think, say when you can get back to them. Leave private documents, home addresses and financial details out of the conversation." },
    ],
    related: { href: "/family-assisted-matrimony", label: "How to involve family in matrimony" },
  },
  {
    slug: "long-distance-matrimony",
    title: "Long-distance matrimony checklist",
    description: "Plan cross-border matrimony conversations between the UK, Canada, Australia and Europe, from time zones to family calls and settling down.",
    intro: "A match across borders needs a workable routine while you get to know each other. Use this checklist when an introduction connects two people who live in different cities, countries or time zones.",
    sections: [
      { title: "Find a time that works for both of you", text: "Share your local time zone and suggest two call windows. If one person is in the UK and the other is in Australia or Canada, take turns choosing a convenient time. Confirm the date as well as the hour before inviting relatives." },
      { title: "Discuss where you could build a life", text: "Ask each other where you would like to live and which commitments would affect a move. Talk through work, caring responsibilities and visits to family. You can write down two realistic options and revisit them after you have spoken a few times." },
      { title: "Agree when to meet and involve family", text: "Decide when you would both feel comfortable meeting or arranging a family call. For a first in-person meeting, choose a public setting and arrange your own transport. Agree how you will keep in touch between calls without expecting either person to be constantly available." },
    ],
    related: { href: "/international-matrimony", label: "Explore regional matrimony pages" },
  },
  {
    slug: "matrimony-partner-preferences",
    title: "How to set matrimony partner preferences",
    description: "Turn broad marriage preferences into practical criteria for language, location, family involvement and shared values.",
    intro: "A clear preference helps someone understand how you imagine married life. Start with the choices that affect your daily life and explain where you are flexible.",
    sections: [
      { title: "Separate essentials from preferences", text: "Write down one or two essentials, such as being able to settle in the same country or agreeing about children. List flexible preferences separately. For example, you might prefer someone who speaks Tamil but be comfortable if they speak another language with you and are open to learning." },
      { title: "Give context for location and family", text: "If you cannot relocate because of work or caring responsibilities, say so in your own words. Describe when you would like family involved and how you would handle differences in traditions. Specific context gives a potential match something they can respond to." },
      { title: "Review your criteria after a few introductions", text: "If your preferences produce very few introductions, revisit one flexible criterion at a time. You could broaden the distance you would consider while keeping your long-term plans clear. If introductions feel unsuitable, add one sentence explaining what you mean by a shared value." },
    ],
    related: { href: "/matrimony-biodata-guide", label: "Write a matrimony biodata with an example" },
  },
] as const;

export const matrimonyGuidePath = (slug: string) => `/matrimony-guides/${slug}`;
