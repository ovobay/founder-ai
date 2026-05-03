export type DesignTasteTheme = "light" | "dark";

export type DesignTasteDensity = "compact" | "comfortable" | "spacious";

export type DesignTasteProfile = {
  id: string;
  name: string;
  source: "refero-inspired";
  description: string;
  mood: string;
  theme: DesignTasteTheme;
  bestFor: string[];
  tokens: {
    background: string;
    surface: string;
    surfaceMuted: string;
    surfaceElevated: string;
    text: string;
    mutedText: string;
    border: string;
    accent: string;
    accentMuted: string;
    primaryAction: string;
    primaryActionText: string;
    destructive: string;
  };
  typography: {
    primaryFont: string;
    monoFont: string;
    scale: {
      display: string;
      headingLg: string;
      heading: string;
      subheading: string;
      body: string;
      small: string;
      caption: string;
    };
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
  surfaces: Array<{
    level: number;
    name: string;
    value: string;
    purpose: string;
  }>;
  componentRecipes: {
    primaryButton: string;
    secondaryButton: string;
    card: string;
    hero: string;
    navigation: string;
    featureGrid: string;
    form: string;
    table: string;
    alert: string;
  };
  layoutDirectives: string[];
  pageCompositionRules: string[];
  rules: {
    do: string[];
    dont: string[];
  };
  qualityBar: string[];
  promptInstructions: string;
};

export const DEFAULT_DESIGN_TASTE_PROFILE_ID = "refero-plain-workbench";

export const DESIGN_TASTE_PROFILES: DesignTasteProfile[] = [
  {
    id: "refero-plain-workbench",
    name: "Refero Plain Workbench",
    source: "refero-inspired",
    description:
      "A crisp digital workbench style based on Refero’s Plain reference: white canvas, cream cards, green accent, precise typography, and restrained product surfaces.",
    mood: "crisp, calm, functional, precise, operational, professional",
    theme: "light",
    bestFor: [
      "dashboards",
      "support desks",
      "admin panels",
      "IT tools",
      "workspace builders",
      "developer tools",
      "B2B product interfaces",
    ],
    tokens: {
      background: "#ffffff",
      surface: "#ffffff",
      surfaceMuted: "#f3fbe9",
      surfaceElevated: "#f9f6f1",
      text: "#0a2414",
      mutedText: "#607166",
      border: "#000000",
      accent: "#1ad379",
      accentMuted: "#17b267",
      primaryAction: "#1ad379",
      primaryActionText: "#0a2414",
      destructive: "#360003",
    },
    typography: {
      primaryFont:
        "ABC Favorit, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      monoFont:
        "Geist Mono, JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      scale: {
        display: "80px / 0.95 / 400",
        headingLg: "48px / 1.04 / 500",
        heading: "24px / 1.17 / 400",
        subheading: "18px / 1.33 / 500",
        body: "15px / 1.33 / 400",
        small: "13px / 1.46 / 500",
        caption: "12px / 1.2 / 400",
      },
      headingStyle:
        "Use large but controlled headings with precise weight shifts, not generic bold marketing text.",
      bodyStyle:
        "Use compact, highly readable body text. Supporting copy should feel product-led, not fluffy.",
      letterSpacing:
        "Use subtle negative tracking for headings and slightly technical tracking for mono labels.",
      weightGuidance:
        "Use 400 for body and major display text, 500 for headlines and labels. Avoid overusing 700/800.",
    },
    shape: {
      buttonRadius: "6px",
      cardRadius: "9px",
      panelRadius: "9px",
      inputRadius: "6px",
    },
    spacing: {
      sectionGap: "40px",
      cardPadding: "24px",
      elementGap: "24px",
      density: "comfortable",
    },
    surfaces: [
      {
        level: 0,
        name: "Canvas White",
        value: "#ffffff",
        purpose: "Base page and modal background.",
      },
      {
        level: 1,
        name: "Ghost Fog",
        value: "#f3fbe9",
        purpose: "Secondary sections, outlines, and subtle content lifts.",
      },
      {
        level: 2,
        name: "Vanilla Cream",
        value: "#f9f6f1",
        purpose: "Cards and elevated content containers.",
      },
      {
        level: 3,
        name: "Deep Forest",
        value: "#283a2e",
        purpose: "Dark feature cards and high-emphasis blocks.",
      },
    ],
    componentRecipes: {
      primaryButton:
        "Use #1ad379 background, #0a2414 text, 6px radius, compact padding. Use only for the most important action.",
      secondaryButton:
        "Use #f3fbe9 background, #17b267 text, #1ad379 border, 6px radius. Use for secondary actions.",
      card:
        "Use #f9f6f1 background, 9px radius, 24px padding, no heavy shadow. Use black or graphite borders for deliberate structure.",
      hero:
        "Use a white canvas, contained max-width, centered headline, compact CTA pair, and product screenshot/card immediately below.",
      navigation:
        "Use ghost text navigation, compact links, and one accent CTA. Keep navigation sticky or visually stable.",
      featureGrid:
        "Use cream cards, precise icons, concise feature copy, and consistent 24px gaps. No glossy gradients.",
      form:
        "Use bordered inputs, 6px radius, compact labels, and functional validation states.",
      table:
        "Use dense readable tables with subtle row separation, mono labels for technical fields, and restrained colour.",
      alert:
        "Use functional warning surfaces only. Do not use alerts decoratively.",
    },
    layoutDirectives: [
      "Use a contained page width, not chaotic full-bleed sections everywhere.",
      "Build around product screenshots, workbench panels, tables, and operational cards.",
      "Use white as the base, Ghost Fog for secondary blocks, Vanilla Cream for cards.",
      "Use Deep Forest sparingly for one premium feature block or contrast section.",
      "Keep section rhythm consistent with 40px vertical gaps.",
    ],
    pageCompositionRules: [
      "Hero must include a clear product promise, one primary CTA, one secondary CTA, and a concrete product preview.",
      "Below hero, show proof of workflow: inputs, panels, dashboards, or real product-like UI.",
      "Feature sections must look like product modules, not generic marketing cards.",
      "Every section must have a clear job: explain, prove, compare, convert, or reassure.",
      "Avoid bland centred text sections with no product evidence.",
    ],
    rules: {
      do: [
        "Use the exact token family: Canvas White, Ghost Fog, Vanilla Cream, Deep Forest, Plain Green.",
        "Use one green accent functionally for CTAs, active states, links, and key status.",
        "Use product screenshots, dashboard cards, data panels, and real UI compositions.",
        "Use borders and surface steps instead of heavy shadows.",
        "Make the output feel like a professional product site, not a blank template.",
      ],
      dont: [
        "Do not create a plain white page with generic cards.",
        "Do not introduce random blue, purple, pink, or gradient accents.",
        "Do not use heavy shadows, glassmorphism, blobs, or decorative orbs.",
        "Do not use inconsistent radii.",
        "Do not use generic system fonts as the design direction.",
        "Do not make every card identical or every section centred.",
      ],
    },
    qualityBar: [
      "The first screen must look credible beside Lovable, Linear, Plain, or modern B2B SaaS references.",
      "The generated UI must include product evidence, not just claims.",
      "The design must include token-consistent surfaces, typography, and component hierarchy.",
      "The site must feel intentionally art-directed.",
      "No section should look like default Tailwind pasted from a tutorial.",
    ],
    promptInstructions:
      "Generate a professional product website using the Refero Plain Workbench taste. Apply exact colours, surfaces, typography, spacing, and component recipes. The result must look intentionally designed, with product previews and strong hierarchy, not a plain generic landing page.",
  },
  {
    id: "refero-warp-terminal",
    name: "Refero Warp Terminal",
    source: "refero-inspired",
    description:
      "A near-monochrome terminal-inspired style with dark command surfaces, sage accent, strict restraint, and no shadow-based depth.",
    mood: "technical, restrained, terminal-native, developer-focused, serious",
    theme: "dark",
    bestFor: [
      "developer tools",
      "AI coding tools",
      "terminal products",
      "infrastructure",
      "automation platforms",
      "technical SaaS",
    ],
    tokens: {
      background: "#141413",
      surface: "#1b1b1a",
      surfaceMuted: "#252523",
      surfaceElevated: "#353534",
      text: "#e3e2e0",
      mutedText: "#a1a09d",
      border: "#3d3d3a",
      accent: "#799c92",
      accentMuted: "#607d74",
      primaryAction: "#ffffff",
      primaryActionText: "#141413",
      destructive: "#ef4444",
    },
    typography: {
      primaryFont:
        "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      monoFont:
        "Geist Mono, JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      scale: {
        display: "72px / 0.95 / 500",
        headingLg: "44px / 1.05 / 500",
        heading: "26px / 1.15 / 500",
        subheading: "18px / 1.35 / 500",
        body: "16px / 1.5 / 400",
        small: "14px / 1.45 / 400",
        caption: "12px / 1.3 / 500",
      },
      headingStyle:
        "Use restrained technical headings. Avoid startup hype language.",
      bodyStyle:
        "Use calm explanatory copy with terminal/product vocabulary.",
      letterSpacing:
        "Use normal text tracking and mono tracking for commands, metrics, and labels.",
      weightGuidance:
        "Use medium weights. Avoid ultra-bold typography.",
    },
    shape: {
      buttonRadius: "10px",
      cardRadius: "14px",
      panelRadius: "18px",
      inputRadius: "10px",
    },
    spacing: {
      sectionGap: "48px",
      cardPadding: "24px",
      elementGap: "16px",
      density: "comfortable",
    },
    surfaces: [
      {
        level: 0,
        name: "Terminal Base",
        value: "#141413",
        purpose: "Base page background.",
      },
      {
        level: 1,
        name: "Panel",
        value: "#1b1b1a",
        purpose: "Main cards and panels.",
      },
      {
        level: 2,
        name: "Command Surface",
        value: "#353534",
        purpose: "Terminal command blocks and code samples.",
      },
    ],
    componentRecipes: {
      primaryButton:
        "Use white background and dark text only for the primary navigation CTA. Do not reuse this treatment everywhere.",
      secondaryButton:
        "Use transparent or muted dark background with #799c92 border/text.",
      card:
        "Use dark stepped surfaces with fine borders. Do not use box shadows.",
      hero:
        "Use a dark base, strong technical headline, terminal/workflow preview, and one maximum-contrast CTA.",
      navigation:
        "Use sparse dark navigation with restrained links and one white CTA.",
      featureGrid:
        "Use dark cards with terminal labels, code-like previews, and sage accent markers.",
      form:
        "Use dark inputs with mono labels and clear focus states.",
      table:
        "Use dark dense tables, mono technical labels, and subtle row dividers.",
      alert:
        "Use muted dark warning panels with restrained accent, not bright neon.",
    },
    layoutDirectives: [
      "Use dark surface steps instead of shadows.",
      "Use terminal/code blocks as product proof.",
      "Keep colour almost monochrome except Terminal Sage.",
      "Make commands and workflows feel real, not decorative.",
    ],
    pageCompositionRules: [
      "Hero should include a terminal/workflow mockup.",
      "Feature sections should explain workflows with command panels and product surfaces.",
      "Use limited colour and strong structure.",
    ],
    rules: {
      do: [
        "Use terminal-inspired panels and mono typography for technical content.",
        "Use #799c92 as the only chromatic accent.",
        "Use surface colour steps for hierarchy.",
      ],
      dont: [
        "Do not introduce additional chromatic colours.",
        "Do not use box shadows or drop shadows.",
        "Do not create a sci-fi neon cockpit.",
      ],
    },
    qualityBar: [
      "Must look like a premium developer tool.",
      "Must include realistic technical/product surfaces.",
      "Must avoid generic dark gradients.",
    ],
    promptInstructions:
      "Generate a technical developer-tool website using a restrained Warp-like terminal taste. Use dark stepped surfaces, sage accent, mono code panels, no shadows, and realistic product workflow previews.",
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
    text.includes("terminal") ||
    text.includes("developer tool") ||
    text.includes("coding") ||
    text.includes("infrastructure") ||
    text.includes("devops") ||
    text.includes("cli")
  ) {
    return "refero-warp-terminal";
  }

  return DEFAULT_DESIGN_TASTE_PROFILE_ID;
}

export function createDesignTastePromptBlock(profile: DesignTasteProfile) {
  return `
CRITICAL DESIGN TASTE SYSTEM
You must treat this as a strict visual design system, not optional inspiration.
The generated website/app must visibly follow this style profile. If the output looks like a plain generic website, it is a failure.

STYLE PROFILE
Name: ${profile.name}
Source: ${profile.source}
Mood: ${profile.mood}
Theme: ${profile.theme}
Best for: ${profile.bestFor.join(", ")}

TOKENS
background: ${profile.tokens.background}
surface: ${profile.tokens.surface}
surfaceMuted: ${profile.tokens.surfaceMuted}
surfaceElevated: ${profile.tokens.surfaceElevated}
text: ${profile.tokens.text}
mutedText: ${profile.tokens.mutedText}
border: ${profile.tokens.border}
accent: ${profile.tokens.accent}
accentMuted: ${profile.tokens.accentMuted}
primaryAction: ${profile.tokens.primaryAction}
primaryActionText: ${profile.tokens.primaryActionText}
destructive: ${profile.tokens.destructive}

TYPOGRAPHY
Primary font stack: ${profile.typography.primaryFont}
Mono font stack: ${profile.typography.monoFont}
Display: ${profile.typography.scale.display}
Heading large: ${profile.typography.scale.headingLg}
Heading: ${profile.typography.scale.heading}
Subheading: ${profile.typography.scale.subheading}
Body: ${profile.typography.scale.body}
Small: ${profile.typography.scale.small}
Caption: ${profile.typography.scale.caption}
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

SURFACE HIERARCHY
${profile.surfaces
  .map(
    (surface) =>
      `Level ${surface.level}: ${surface.name} (${surface.value}) — ${surface.purpose}`
  )
  .join("\n")}

COMPONENT RECIPES
Primary button: ${profile.componentRecipes.primaryButton}
Secondary button: ${profile.componentRecipes.secondaryButton}
Card: ${profile.componentRecipes.card}
Hero: ${profile.componentRecipes.hero}
Navigation: ${profile.componentRecipes.navigation}
Feature grid: ${profile.componentRecipes.featureGrid}
Form: ${profile.componentRecipes.form}
Table: ${profile.componentRecipes.table}
Alert: ${profile.componentRecipes.alert}

LAYOUT DIRECTIVES
${profile.layoutDirectives.map((rule) => `- ${rule}`).join("\n")}

PAGE COMPOSITION RULES
${profile.pageCompositionRules.map((rule) => `- ${rule}`).join("\n")}

DO
${profile.rules.do.map((rule) => `- ${rule}`).join("\n")}

DON'T
${profile.rules.dont.map((rule) => `- ${rule}`).join("\n")}

QUALITY BAR
${profile.qualityBar.map((rule) => `- ${rule}`).join("\n")}

STRICT OUTPUT REQUIREMENTS
- Generate UI with clear art direction using the tokens above.
- Include product evidence: screenshots, dashboard mockups, workflow panels, tables, or realistic UI previews.
- Create a strong first screen that looks professionally designed.
- Use the exact colour palette and surface hierarchy.
- Use component recipes directly.
- Do not output a plain generic website.
- Do not use unrelated default Tailwind blue/purple gradients.
- Do not add decorative blobs, meaningless orbs, random sparkles, or generic glass cards.
- Do not copy any real brand directly. Use this as taste guidance only.
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
