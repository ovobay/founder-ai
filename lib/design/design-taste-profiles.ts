export type DesignTasteTheme = "light" | "dark";

export type DesignTasteDensity = "compact" | "comfortable" | "spacious";

export type DesignTasteProfile = {
  id: string;
  name: string;
  description: string;
  mood: string;
  theme: DesignTasteTheme;
  bestFor: string[];
  tokens: {
    background: string;
    surface: string;
    surfaceMuted: string;
    text: string;
    mutedText: string;
    border: string;
    accent: string;
    primaryAction: string;
    destructive: string;
  };
  typography: {
    headingStyle: string;
    bodyStyle: string;
    letterSpacing: string;
    weightGuidance: string;
  };
  shape: {
    buttonRadius: string;
    cardRadius: string;
    panelRadius: string;
    inputRadius: string;
  };
  spacing: {
    sectionGap: string;
    cardPadding: string;
    elementGap: string;
    density: DesignTasteDensity;
  };
  components: {
    buttons: string;
    cards: string;
    navigation: string;
    forms: string;
    tables: string;
    alerts: string;
  };
  rules: {
    do: string[];
    dont: string[];
  };
  promptInstructions: string;
};

export const DEFAULT_DESIGN_TASTE_PROFILE_ID = "plain-workbench";

export const DESIGN_TASTE_PROFILES: DesignTasteProfile[] = [
  {
    id: "plain-workbench",
    name: "Plain Workbench",
    description:
      "A crisp, restrained product workbench style for dashboards, support tools, admin panels, and operational software.",
    mood: "calm, functional, precise, trustworthy, low-noise",
    theme: "light",
    bestFor: [
      "dashboards",
      "support desks",
      "admin panels",
      "IT tools",
      "project workspaces",
      "internal tools",
      "B2B product interfaces",
    ],
    tokens: {
      background: "#ffffff",
      surface: "#ffffff",
      surfaceMuted: "#f7f7f4",
      text: "#111827",
      mutedText: "#6b7280",
      border: "#e5e7eb",
      accent: "#16a34a",
      primaryAction: "#111827",
      destructive: "#dc2626",
    },
    typography: {
      headingStyle:
        "Use clear compact headings with strong hierarchy and slight negative letter spacing.",
      bodyStyle:
        "Use readable body text with restrained line height and muted supporting copy.",
      letterSpacing:
        "Use subtle negative letter spacing for headings and neutral spacing for body copy.",
      weightGuidance:
        "Use semibold for labels and headings, medium for rows and buttons, regular for descriptions.",
    },
    shape: {
      buttonRadius: "10px",
      cardRadius: "14px",
      panelRadius: "18px",
      inputRadius: "12px",
    },
    spacing: {
      sectionGap: "24px",
      cardPadding: "20px",
      elementGap: "12px",
      density: "comfortable",
    },
    components: {
      buttons:
        "Buttons should be compact, functional, and mostly neutral. Use the accent colour only for meaningful actions.",
      cards:
        "Cards should be flat or lightly bordered. Avoid heavy shadows. Use clean dividers and subtle backgrounds.",
      navigation:
        "Navigation should be understated, text-first, and easy to scan. Active states should be clear but not loud.",
      forms:
        "Inputs should be simple, bordered, and readable. Avoid oversized fields unless the input is the main product action.",
      tables:
        "Tables should be dense but readable, with clear row separation and muted secondary text.",
      alerts:
        "Alerts should be direct and functional. Use warning/destructive styles only when action is required.",
    },
    rules: {
      do: [
        "Use one primary accent colour functionally.",
        "Keep backgrounds white or soft off-white.",
        "Use borders and dividers instead of heavy shadows.",
        "Prioritise clarity, structure, and readable hierarchy.",
        "Make the product UI feel calm and operational.",
      ],
      dont: [
        "Do not use decorative gradients.",
        "Do not use multiple saturated accent colours.",
        "Do not use heavy shadows or glossy cards.",
        "Do not create oversized hero cards inside dashboards.",
        "Do not make every component rounded like a children’s toy.",
      ],
    },
    promptInstructions:
      "Design this as a restrained product workbench. Use white/off-white surfaces, subtle borders, compact controls, readable tables, and one functional accent colour. Avoid gradients, decorative colour explosions, and heavy shadows.",
  },
  {
    id: "cycle-soft-saas",
    name: "Cycle Soft SaaS",
    description:
      "A friendly rounded SaaS style for collaboration tools, AI products, onboarding pages, and customer-facing product sites.",
    mood: "friendly, soft, polished, collaborative, approachable",
    theme: "light",
    bestFor: [
      "SaaS landing pages",
      "AI tools",
      "collaboration products",
      "knowledge bases",
      "customer onboarding",
      "product marketing pages",
    ],
    tokens: {
      background: "#fbfaf7",
      surface: "#ffffff",
      surfaceMuted: "#f4f2ec",
      text: "#171717",
      mutedText: "#737373",
      border: "#e7e5df",
      accent: "#6366f1",
      primaryAction: "#111827",
      destructive: "#dc2626",
    },
    typography: {
      headingStyle:
        "Use warm rounded modern headings with confident hierarchy and generous whitespace.",
      bodyStyle:
        "Use friendly readable body text with relaxed spacing and clear supporting descriptions.",
      letterSpacing:
        "Use slight negative tracking for large headings and normal tracking for body text.",
      weightGuidance:
        "Use bold headings, semibold section titles, medium buttons, and regular descriptions.",
    },
    shape: {
      buttonRadius: "12px",
      cardRadius: "20px",
      panelRadius: "24px",
      inputRadius: "14px",
    },
    spacing: {
      sectionGap: "64px",
      cardPadding: "24px",
      elementGap: "16px",
      density: "spacious",
    },
    components: {
      buttons:
        "Buttons should feel friendly and tactile, with rounded corners and clear primary/secondary hierarchy.",
      cards:
        "Cards should use soft radius, subtle elevation, and muted backgrounds without becoming decorative clutter.",
      navigation:
        "Navigation should be simple and friendly, with generous spacing and clear active states.",
      forms:
        "Forms should feel welcoming, with clear labels and comfortable input height.",
      tables:
        "Use tables sparingly. Prefer cards or grouped lists for customer-facing sections.",
      alerts:
        "Alerts should be helpful and soft, using muted backgrounds rather than aggressive styling.",
    },
    rules: {
      do: [
        "Use generous spacing between sections.",
        "Use rounded cards and soft neutral surfaces.",
        "Use muted accent colours carefully.",
        "Make the interface feel friendly and modern.",
        "Use simple product screenshots or UI previews as anchor visuals.",
      ],
      dont: [
        "Do not use harsh black/white contrast everywhere.",
        "Do not overload the interface with gradients.",
        "Do not use too many accent colours at once.",
        "Do not make dashboards overly playful.",
        "Do not crowd sections together.",
      ],
    },
    promptInstructions:
      "Design this as a friendly modern SaaS product. Use soft rounded cards, generous spacing, muted surfaces, simple navigation, and a clear primary CTA. Avoid harsh contrast, clutter, and random decorative gradients.",
  },
  {
    id: "standards-precision",
    name: "Standards Precision",
    description:
      "A strict high-contrast enterprise style for cybersecurity, compliance, legal, infrastructure, and serious B2B products.",
    mood: "serious, precise, minimal, confident, authoritative",
    theme: "light",
    bestFor: [
      "cybersecurity",
      "compliance",
      "enterprise B2B",
      "legal technology",
      "infrastructure tools",
      "developer platforms",
    ],
    tokens: {
      background: "#ffffff",
      surface: "#ffffff",
      surfaceMuted: "#f5f5f5",
      text: "#0a0a0a",
      mutedText: "#5f5f5f",
      border: "#d4d4d4",
      accent: "#f97316",
      primaryAction: "#0a0a0a",
      destructive: "#b91c1c",
    },
    typography: {
      headingStyle:
        "Use sharp high-confidence headings with tight spacing and strong contrast.",
      bodyStyle:
        "Use concise supporting copy. Keep body text direct and serious.",
      letterSpacing:
        "Use tight negative tracking for headings and precise spacing for labels.",
      weightGuidance:
        "Use strong heading weights, medium labels, and restrained body text.",
    },
    shape: {
      buttonRadius: "6px",
      cardRadius: "8px",
      panelRadius: "10px",
      inputRadius: "6px",
    },
    spacing: {
      sectionGap: "40px",
      cardPadding: "20px",
      elementGap: "10px",
      density: "compact",
    },
    components: {
      buttons:
        "Buttons should be sharp, compact, and high-contrast. Use orange only for the main CTA or warning emphasis.",
      cards:
        "Cards should be minimal, bordered, and flat. Avoid decorative elevation.",
      navigation:
        "Navigation should be direct and utilitarian, with clear active states and minimal ornament.",
      forms:
        "Forms should be dense, precise, and clearly labelled.",
      tables:
        "Tables should be compact, serious, and suitable for enterprise review.",
      alerts:
        "Alerts should be direct, high-contrast, and action-oriented.",
    },
    rules: {
      do: [
        "Use a near-monochrome visual system.",
        "Reserve orange for primary action or important emphasis.",
        "Use sharp borders and minimal shadows.",
        "Keep copy concise and serious.",
        "Make the interface feel enterprise-grade.",
      ],
      dont: [
        "Do not use pastel gradients.",
        "Do not use multiple accent colours.",
        "Do not use playful illustrations.",
        "Do not use large soft pill shapes everywhere.",
        "Do not make the interface look like a consumer toy.",
      ],
    },
    promptInstructions:
      "Design this as a serious enterprise product. Use high contrast, monochrome surfaces, sharp components, compact spacing, and one orange accent for the primary action. Avoid gradients, playful colours, and soft decorative UI.",
  },
  {
    id: "mercury-command",
    name: "Mercury Command",
    description:
      "A premium dark command-center style for fintech, executive dashboards, founder tools, and high-trust operational products.",
    mood: "premium, calm, executive, controlled, high-trust",
    theme: "dark",
    bestFor: [
      "fintech",
      "executive dashboards",
      "founder dashboards",
      "command centers",
      "premium SaaS",
      "analytics products",
    ],
    tokens: {
      background: "#08090a",
      surface: "#111315",
      surfaceMuted: "#191b1f",
      text: "#f4f1ea",
      mutedText: "#a3a3a3",
      border: "#2a2d33",
      accent: "#6366f1",
      primaryAction: "#6366f1",
      destructive: "#ef4444",
    },
    typography: {
      headingStyle:
        "Use elegant spacious headings with restrained weight and premium contrast.",
      bodyStyle:
        "Use quiet readable body text with muted supporting descriptions.",
      letterSpacing:
        "Use subtle negative tracking for headings and normal spacing for labels.",
      weightGuidance:
        "Avoid overly heavy typography. Use controlled semibold weights.",
    },
    shape: {
      buttonRadius: "12px",
      cardRadius: "18px",
      panelRadius: "22px",
      inputRadius: "12px",
    },
    spacing: {
      sectionGap: "48px",
      cardPadding: "24px",
      elementGap: "14px",
      density: "comfortable",
    },
    components: {
      buttons:
        "Buttons should feel premium and restrained. Use violet-blue as the primary CTA only.",
      cards:
        "Cards should use dark surfaces, fine borders, and very subtle depth. Avoid glow abuse.",
      navigation:
        "Navigation should feel quiet, focused, and executive-grade.",
      forms:
        "Forms should be clean, dark, and clearly readable with high enough contrast.",
      tables:
        "Tables should use dark rows, subtle separators, and calm numeric hierarchy.",
      alerts:
        "Alerts should be visible but not neon. Use controlled colour emphasis.",
    },
    rules: {
      do: [
        "Use deep dark backgrounds and off-white text.",
        "Use one violet-blue accent for primary actions.",
        "Keep the interface spacious and calm.",
        "Use subtle borders instead of glowing effects.",
        "Make it feel premium, operational, and mature.",
      ],
      dont: [
        "Do not use neon gradients.",
        "Do not overuse glow effects.",
        "Do not use multiple bright accents.",
        "Do not make everything black with poor contrast.",
        "Do not turn the dashboard into a sci-fi cockpit.",
      ],
    },
    promptInstructions:
      "Design this as a premium dark command center. Use deep dark surfaces, off-white text, subtle borders, spacious layouts, and one violet-blue primary accent. Avoid neon gradients, excessive glow, and sci-fi clutter.",
  },
];

export function getDesignTasteProfile(id?: string | null): DesignTasteProfile {
  const fallback =
    DESIGN_TASTE_PROFILES.find(
      (profile) => profile.id === DEFAULT_DESIGN_TASTE_PROFILE_ID
    ) ?? DESIGN_TASTE_PROFILES[0];

  if (!id) return fallback;

  return DESIGN_TASTE_PROFILES.find((profile) => profile.id === id) ?? fallback;
}

export function inferDesignTasteProfileId(input: {
  projectType?: string | null;
  industry?: string | null;
  prompt?: string | null;
}) {
  const text = [input.projectType, input.industry, input.prompt]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    text.includes("cyber") ||
    text.includes("security") ||
    text.includes("compliance") ||
    text.includes("legal") ||
    text.includes("enterprise")
  ) {
    return "standards-precision";
  }

  if (
    text.includes("fintech") ||
    text.includes("finance") ||
    text.includes("bank") ||
    text.includes("executive") ||
    text.includes("command center") ||
    text.includes("dark")
  ) {
    return "mercury-command";
  }

  if (
    text.includes("landing") ||
    text.includes("marketing") ||
    text.includes("saas") ||
    text.includes("collaboration") ||
    text.includes("onboarding")
  ) {
    return "cycle-soft-saas";
  }

  if (
    text.includes("dashboard") ||
    text.includes("admin") ||
    text.includes("support") ||
    text.includes("helpdesk") ||
    text.includes("workspace") ||
    text.includes("internal")
  ) {
    return "plain-workbench";
  }

  return DEFAULT_DESIGN_TASTE_PROFILE_ID;
}

export function createDesignTastePromptBlock(profile: DesignTasteProfile) {
  return `
DESIGN TASTE PROFILE
Name: ${profile.name}
Mood: ${profile.mood}
Theme: ${profile.theme}
Best for: ${profile.bestFor.join(", ")}

TOKENS
Background: ${profile.tokens.background}
Surface: ${profile.tokens.surface}
Muted surface: ${profile.tokens.surfaceMuted}
Text: ${profile.tokens.text}
Muted text: ${profile.tokens.mutedText}
Border: ${profile.tokens.border}
Accent: ${profile.tokens.accent}
Primary action: ${profile.tokens.primaryAction}
Destructive: ${profile.tokens.destructive}

TYPOGRAPHY
Heading style: ${profile.typography.headingStyle}
Body style: ${profile.typography.bodyStyle}
Letter spacing: ${profile.typography.letterSpacing}
Weight guidance: ${profile.typography.weightGuidance}

SHAPE
Button radius: ${profile.shape.buttonRadius}
Card radius: ${profile.shape.cardRadius}
Panel radius: ${profile.shape.panelRadius}
Input radius: ${profile.shape.inputRadius}

SPACING
Section gap: ${profile.spacing.sectionGap}
Card padding: ${profile.spacing.cardPadding}
Element gap: ${profile.spacing.elementGap}
Density: ${profile.spacing.density}

COMPONENT GUIDANCE
Buttons: ${profile.components.buttons}
Cards: ${profile.components.cards}
Navigation: ${profile.components.navigation}
Forms: ${profile.components.forms}
Tables: ${profile.components.tables}
Alerts: ${profile.components.alerts}

DO
${profile.rules.do.map((rule) => `- ${rule}`).join("\n")}

DON'T
${profile.rules.dont.map((rule) => `- ${rule}`).join("\n")}

STRICT DESIGN INSTRUCTIONS
${profile.promptInstructions}

ANTI-GENERIC-AI-DESIGN RULES
- Do not invent unrelated gradients.
- Do not use random accent colours outside the profile.
- Do not use generic glassmorphism unless the profile explicitly calls for it.
- Do not create oversized rounded cards without hierarchy.
- Do not use decorative blobs, floating orbs, random sparkles, or meaningless background shapes.
- Do not mix multiple design styles in one generated product.
- Do not copy any real brand directly.
- Use this profile as taste guidance only. Generate original branding, layout, copy, and components.
`.trim();
}

export function createDesignTastePromptBlockFromInput(input: {
  projectType?: string | null;
  industry?: string | null;
  prompt?: string | null;
  profileId?: string | null;
}) {
  const profile = getDesignTasteProfile(
    input.profileId ??
      inferDesignTasteProfileId({
        projectType: input.projectType,
        industry: input.industry,
        prompt: input.prompt,
      })
  );

  return createDesignTastePromptBlock(profile);
}
