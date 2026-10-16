export type Article = {
  slug: string;
  title: string;
  description: string;
  category: string;
  sections: { heading: string; body: string }[];
};
export const articles: Article[] = [
  {
    slug: "finding-love-in-modern-times",
    title: "Build a profile that feels like you",
    description:
      "A practical guide to sharing your interests, values and future plans with clarity.",
    category: "Getting started",
    sections: [
      {
        heading: "Start with your everyday life",
        body: "Describe what you enjoy, the people and interests that matter to you, and what a good day looks like. Specific details make it easier for another person to start a conversation.",
      },
      {
        heading: "Be clear about your intentions",
        body: "Share what you are looking for and the pace that feels comfortable. Discuss important expectations directly, including location, family involvement and future plans.",
      },
      {
        heading: "Choose what to share",
        body: "Use recent photos and review your privacy settings. Keep sensitive contact information, financial details and identity documents out of your public biography.",
      },
      {
        heading: "Take the next step thoughtfully",
        body: "A profile is an introduction. Take time to talk, ask questions and decide together whether to continue. Use the report and block tools if an interaction makes you uncomfortable.",
      },
    ],
  },
  {
    slug: "cultural-nuances-in-indian-sri-lankan-marriages",
    title: "Talk about culture without making assumptions",
    description:
      "Conversation starters for language, traditions, family expectations and living between countries.",
    category: "Culture and family",
    sections: [
      {
        heading: "Ask what matters to the individual",
        body: "Shared heritage can mean different things to different people. Ask which languages, celebrations, foods or traditions matter to your match rather than assuming that a label tells the whole story.",
      },
      {
        heading: "Discuss family involvement",
        body: "Talk about when and how each of you would like to involve family. Agree on boundaries and check with each other before sharing private conversations or profile details.",
      },
      {
        heading: "Compare your future plans",
        body: "Discuss where you would like to live, your work priorities and whether relocation is a possibility. Explain what is flexible and what is important to you.",
      },
      {
        heading: "Leave room for differences",
        body: "You do not need identical preferences to have a useful conversation. Listen, explain your own perspective and allow each other time to consider a decision.",
      },
    ],
  },
  {
    slug: "astrology-and-compatibility-a-guide",
    title: "Keep compatibility conversations grounded",
    description:
      "Use profile information and cultural preferences as conversation starters while getting to know the person.",
    category: "Understanding compatibility",
    sections: [
      {
        heading: "A score is a starting point",
        body: "Profile comparisons reflect the information people provide and the rules used to compare it. They do not establish character, verify identity or guarantee a successful relationship.",
      },
      {
        heading: "Discuss the reasons behind preferences",
        body: "Ask why a preference matters and how it affects everyday life. Values, communication, expectations and consent deserve a direct conversation.",
      },
      {
        heading: "Respect cultural practices",
        body: "If horoscope traditions matter to you, discuss that openly. Horoscope interpretations are cultural or belief-based; they do not provide scientifically established predictions of relationship success.",
      },
      {
        heading: "Make your own decision",
        body: "Take your time, look for consistency and respect each other’s boundaries. You can pause a conversation, decline an introduction or seek support whenever you need to.",
      },
    ],
  },
];
