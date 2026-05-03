export type ReferoStylePack = {
  id: string;
  name: string;
  description: string;
  bestFor: string[];
  theme: "light" | "dark";
  tokens: {
    background: string;
    surface: string;
    surfaceMuted: string;
    surfaceElevated: string;
    text: string;
    mutedText: string;
    border: string;
    accent: string;
    accentText: string;
    primaryAction: string;
    primaryActionText: string;
  };
  typography: {
    fontFamily: string;
    display: string;
    heading: string;
    subheading: string;
    body: string;
    small: string;
    weightRule: string;
    letterSpacingRule: string;
  };
  layout: {
    maxWidth: string;
    sectionPadding: string;
    sectionGap: string;
    cardGap: string;
    density: "compact" | "comfortable" | "spacious";
  };
  shape: {
    buttonRadius: string;
    cardRadius: string;
    panelRadius: string;
    inputRadius: string;
  };
  components: {
    hero: string;
    navigation: string;
    buttons: string;
    cards: string;
    productPreview: string;
    featureSection: string;
    pricing: string;
    testimonial: string;
    finalCta: string;
  };
  motion: {
    pageEntrance: string;
    hover: string;
    transition: string;
  };
  do: string[];
  dont: string[];
};

export const REFERO_STYLE_PACKS: ReferoStylePack[] = [
  {
    id: "linear-polished-saas",
    name: "Linear Polished SaaS",
    description:
      "A polished SaaS/product website style inspired by Linear-style references: dark command surfaces, sharp typography, precise spacing, premium gradients used sparingly, and strong product preview sections.",
    bestFor: [
      "saas",
      "landing",
      "product website",
      "ai builder",
      "startup",
      "developer tool",
      "productivity",
      "workflow",
    ],
    theme: "dark",
    tokens: {
      background: "#08090d",
      surface: "#11131a",
      surfaceMuted: "#181b24",
      surfaceElevated: "#202432",
      text: "#f7f8fb",
      mutedText: "#9ca3af",
      border: "#2a2f3d",
      accent: "#8b5cf6",
      accentText: "#ffffff",
      primaryAction: "#f7f8fb",
      primaryActionText: "#08090d",
    },
    typography: {
      fontFamily:
        "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      display: "76px / 0.95 / 650",
      heading: "44px / 1.05 / 650",
      subheading: "22px / 1.25 / 550",
      body: "16px / 1.55 / 400",
      small: "14px / 1.45 / 500",
      weightRule:
        "Use strong display headings, medium labels, and calm body text. Avoid making every line extra-bold.",
      letterSpacingRule:
        "Use tight negative tracking on display and headings. Keep body text readable.",
    },
    layout: {
      maxWidth: "1180px",
      sectionPadding: "88px 24px",
      sectionGap: "64px",
      cardGap: "18px",
      density: "comfortable",
    },
    shape: {
      buttonRadius: "12px",
      cardRadius: "20px",
      panelRadius: "28px",
      inputRadius: "14px",
    },
    components: {
      hero:
        "Dark premium hero with a clear product promise, concise subtitle, CTA pair, and a large realistic product preview.",
      navigation:
        "Minimal top navigation with quiet links, product logo, and one clear CTA.",
      buttons:
        "Primary buttons should be high-contrast. Secondary buttons should use transparent/dark surfaces with borders.",
      cards:
        "Dark elevated cards with subtle borders and restrained shadows. No random neon glow.",
      productPreview:
        "Large dashboard/workspace mockup with sidebar, cards, tables, alerts, workflow panels, and realistic data.",
      featureSection:
        "Use product-led sections with UI fragments and proof, not generic icon cards.",
      pricing:
        "Use clean plan cards with one highlighted plan and clear billing copy.",
      testimonial:
        "Use restrained proof, logos, or short metrics instead of huge fake quote blocks.",
      finalCta:
        "Use a compact premium CTA panel with one direct action.",
    },
    motion: {
      pageEntrance: "Subtle fade with 12px upward motion.",
      hover: "Small lift, border emphasis, and controlled brightness.",
      transition: "200ms ease-out.",
    },
    do: [
      "Use a professional SaaS first screen.",
      "Show product evidence immediately.",
      "Use dark surfaces with precise hierarchy.",
      "Use accent colour sparingly.",
      "Make the page feel like a real funded product site.",
    ],
    dont: [
      "Do not generate a plain white website.",
      "Do not create generic Tailwind card grids.",
      "Do not use random decorative blobs or orbs.",
      "Do not leak design metadata into visible UI.",
      "Do not copy Linear directly.",
    ],
  },
  {
    id: "plain-workbench",
    name: "Plain Workbench",
    description:
      "A crisp, restrained product workbench style for dashboards, helpdesks, internal tools, and B2B apps.",
    bestFor: [
      "dashboard",
      "admin",
      "helpdesk",
      "support",
      "it",
      "workspace",
      "internal tool",
      "b2b",
    ],
    theme: "light",
    tokens: {
      background: "#ffffff",
      surface: "#ffffff",
      surfaceMuted: "#f3fbe9",
      surfaceElevated: "#f9f6f1",
      text: "#0a2414",
      mutedText: "#607166",
      border: "#d7dfd2",
      accent: "#1ad379",
      accentText: "#0a2414",
      primaryAction: "#1ad379",
      primaryActionText: "#0a2414",
    },
    typography: {
      fontFamily:
        "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      display: "72px / 0.95 / 500",
      heading: "40px / 1.05 / 500",
      subheading: "22px / 1.2 / 500",
      body: "15px / 1.5 / 400",
      small: "13px / 1.4 / 500",
      weightRule:
        "Use 400 and 500 mostly. Avoid fake-heavy AI typography everywhere.",
      letterSpacingRule:
        "Use slight negative letter spacing for display and headings.",
    },
    layout: {
      maxWidth: "1180px",
      sectionPadding: "72px 24px",
      sectionGap: "40px",
      cardGap: "18px",
      density: "comfortable",
    },
    shape: {
      buttonRadius: "8px",
      cardRadius: "14px",
      panelRadius: "18px",
      inputRadius: "10px",
    },
    components: {
      hero:
        "White/off-white hero, strong product promise, compact CTA pair, and a large product dashboard preview below.",
      navigation:
        "Minimal nav, clean text links, one accent CTA, no noisy gradients.",
      buttons:
        "Compact, functional buttons. Primary uses green accent. Secondary uses muted surface.",
      cards:
        "Cream or soft green cards with borders, low/no shadow, clear hierarchy.",
      productPreview:
        "Realistic dashboard mockup with sidebar, metrics, table rows, alerts, workflow panels.",
      featureSection:
        "Features should feel like product modules, not generic icon cards.",
      pricing:
        "Simple bordered pricing cards with one highlighted plan.",
      testimonial:
        "Use restrained proof blocks, logos, or metric proof.",
      finalCta:
        "Compact conversion section with clear CTA and one supporting sentence.",
    },
    motion: {
      pageEntrance: "Subtle fade and 12px upward movement.",
      hover: "Small translateY(-2px), border/accent change.",
      transition: "180ms ease-out.",
    },
    do: [
      "Use real product preview sections.",
      "Use surface hierarchy instead of loud colours.",
      "Keep copy precise and product-led.",
      "Use green only for meaningful states and CTAs.",
    ],
    dont: [
      "Do not use generic dark hero blocks.",
      "Do not use random blue/purple gradients.",
      "Do not create plain white card grids with no product evidence.",
      "Do not use decorative blobs, orbs, or fake glassmorphism.",
    ],
  },
  {
    id: "soft-saas",
    name: "Soft SaaS",
    description:
      "Friendly, polished SaaS style for landing pages, onboarding products, AI apps, and collaboration tools.",
    bestFor: [
      "saas",
      "landing",
      "marketing",
      "ai",
      "onboarding",
      "collaboration",
    ],
    theme: "light",
    tokens: {
      background: "#fbfaf7",
      surface: "#ffffff",
      surfaceMuted: "#f4f2ec",
      surfaceElevated: "#ffffff",
      text: "#171717",
      mutedText: "#737373",
      border: "#e7e5df",
      accent: "#6366f1",
      accentText: "#ffffff",
      primaryAction: "#111827",
      primaryActionText: "#ffffff",
    },
    typography: {
      fontFamily:
        "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      display: "76px / 0.95 / 650",
      heading: "44px / 1.05 / 650",
      subheading: "22px / 1.25 / 550",
      body: "16px / 1.55 / 400",
      small: "14px / 1.45 / 500",
      weightRule: "Use confident headings and relaxed body copy.",
      letterSpacingRule: "Use negative tracking on large headings only.",
    },
    layout: {
      maxWidth: "1200px",
      sectionPadding: "88px 24px",
      sectionGap: "64px",
      cardGap: "22px",
      density: "spacious",
    },
    shape: {
      buttonRadius: "14px",
      cardRadius: "24px",
      panelRadius: "28px",
      inputRadius: "14px",
    },
    components: {
      hero:
        "Large centered headline, soft background, CTA pair, proof strip, polished UI preview.",
      navigation:
        "Simple friendly nav with rounded CTA and subtle background.",
      buttons:
        "Rounded tactile buttons with clear primary/secondary hierarchy.",
      cards:
        "Soft rounded cards with light border and gentle depth.",
      productPreview:
        "Clean SaaS dashboard with cards, activity, charts, and onboarding checklist.",
      featureSection:
        "Use grouped feature cards with concise copy and UI fragments.",
      pricing:
        "Three soft cards, middle plan highlighted, friendly plan names.",
      testimonial:
        "Customer proof with logos, short quote, and measurable result.",
      finalCta:
        "Soft rounded CTA panel with bold promise and direct button.",
    },
    motion: {
      pageEntrance: "Soft fade and upward movement.",
      hover: "Gentle lift and border emphasis.",
      transition: "220ms ease.",
    },
    do: [
      "Use generous whitespace.",
      "Use soft rounded surfaces.",
      "Make the page feel friendly but still professional.",
    ],
    dont: [
      "Do not make it childish.",
      "Do not use too many pastel accents.",
      "Do not use default blue Tailwind gradients.",
    ],
  },
  {
    id: "enterprise-precision",
    name: "Enterprise Precision",
    description:
      "Sharp, serious, high-contrast style for cybersecurity, legal, compliance, and enterprise B2B.",
    bestFor: ["cybersecurity", "security", "legal", "compliance", "enterprise"],
    theme: "light",
    tokens: {
      background: "#ffffff",
      surface: "#ffffff",
      surfaceMuted: "#f5f5f5",
      surfaceElevated: "#fafafa",
      text: "#0a0a0a",
      mutedText: "#5f5f5f",
      border: "#d4d4d4",
      accent: "#f97316",
      accentText: "#111111",
      primaryAction: "#0a0a0a",
      primaryActionText: "#ffffff",
    },
    typography: {
      fontFamily:
        "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      display: "68px / 0.98 / 650",
      heading: "40px / 1.08 / 650",
      subheading: "21px / 1.25 / 550",
      body: "15px / 1.5 / 400",
      small: "13px / 1.4 / 500",
      weightRule: "Use strong but not bloated type.",
      letterSpacingRule: "Use tight headings and precise labels.",
    },
    layout: {
      maxWidth: "1160px",
      sectionPadding: "72px 24px",
      sectionGap: "36px",
      cardGap: "14px",
      density: "compact",
    },
    shape: {
      buttonRadius: "6px",
      cardRadius: "8px",
      panelRadius: "10px",
      inputRadius: "6px",
    },
    components: {
      hero:
        "Sharp enterprise hero with concise claim, proof metrics, and product/security evidence.",
      navigation:
        "Minimal navigation, high contrast, one black CTA.",
      buttons:
        "Sharp compact buttons. Orange only for emphasis, never decoration.",
      cards:
        "Flat bordered cards. No decorative gradients.",
      productPreview:
        "Security/compliance dashboard with alerts, audit rows, risk table, incident timeline.",
      featureSection:
        "Dense proof-driven feature blocks with technical clarity.",
      pricing:
        "Serious plan comparison with enterprise CTA.",
      testimonial:
        "Use metrics, compliance proof, or customer logos.",
      finalCta:
        "Direct enterprise CTA with minimal copy.",
    },
    motion: {
      pageEntrance: "Minimal fade only.",
      hover: "Border and background change only.",
      transition: "160ms ease.",
    },
    do: [
      "Use high contrast.",
      "Use orange sparingly.",
      "Make the page feel trusted and serious.",
    ],
    dont: [
      "Do not use playful visuals.",
      "Do not use soft pastel SaaS styling.",
      "Do not over-round components.",
    ],
  },
];

export const DEFAULT_REFERO_STYLE_PACK_ID = "linear-polished-saas";

export function getReferoStylePack(id?: string | null): ReferoStylePack {
  return (
    REFERO_STYLE_PACKS.find((pack) => pack.id === id) ??
    REFERO_STYLE_PACKS.find(
      (pack) => pack.id === DEFAULT_REFERO_STYLE_PACK_ID
    ) ??
    REFERO_STYLE_PACKS[0]
  );
}

export function inferReferoStylePackId(input: {
  prompt?: string | null;
  projectType?: string | null;
  industry?: string | null;
}) {
  const text = [input.prompt, input.projectType, input.industry]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    text.includes("cyber") ||
    text.includes("security") ||
    text.includes("legal") ||
    text.includes("compliance") ||
    text.includes("enterprise")
  ) {
    return "enterprise-precision";
  }

  if (
    text.includes("helpdesk") ||
    text.includes("support") ||
    text.includes("ticket") ||
    text.includes("dashboard") ||
    text.includes("admin") ||
    text.includes("internal")
  ) {
    return "plain-workbench";
  }

  if (
    text.includes("landing") ||
    text.includes("marketing") ||
    text.includes("saas") ||
    text.includes("onboarding") ||
    text.includes("collaboration")
  ) {
    return "linear-polished-saas";
  }

  return DEFAULT_REFERO_STYLE_PACK_ID;
}

export function createReferoDesignBrief(pack: ReferoStylePack) {
  return `
REFERO STYLE PACK
Name: ${pack.name}
Description: ${pack.description}
Theme: ${pack.theme}
Best for: ${pack.bestFor.join(", ")}

TOKENS
background=${pack.tokens.background}
surface=${pack.tokens.surface}
surfaceMuted=${pack.tokens.surfaceMuted}
surfaceElevated=${pack.tokens.surfaceElevated}
text=${pack.tokens.text}
mutedText=${pack.tokens.mutedText}
border=${pack.tokens.border}
accent=${pack.tokens.accent}
accentText=${pack.tokens.accentText}
primaryAction=${pack.tokens.primaryAction}
primaryActionText=${pack.tokens.primaryActionText}

TYPOGRAPHY
fontFamily=${pack.typography.fontFamily}
display=${pack.typography.display}
heading=${pack.typography.heading}
subheading=${pack.typography.subheading}
body=${pack.typography.body}
small=${pack.typography.small}
weightRule=${pack.typography.weightRule}
letterSpacingRule=${pack.typography.letterSpacingRule}

LAYOUT
maxWidth=${pack.layout.maxWidth}
sectionPadding=${pack.layout.sectionPadding}
sectionGap=${pack.layout.sectionGap}
cardGap=${pack.layout.cardGap}
density=${pack.layout.density}

SHAPE
buttonRadius=${pack.shape.buttonRadius}
cardRadius=${pack.shape.cardRadius}
panelRadius=${pack.shape.panelRadius}
inputRadius=${pack.shape.inputRadius}

COMPONENT RECIPES
Hero: ${pack.components.hero}
Navigation: ${pack.components.navigation}
Buttons: ${pack.components.buttons}
Cards: ${pack.components.cards}
Product preview: ${pack.components.productPreview}
Feature section: ${pack.components.featureSection}
Pricing: ${pack.components.pricing}
Testimonial: ${pack.components.testimonial}
Final CTA: ${pack.components.finalCta}

MOTION
Page entrance: ${pack.motion.pageEntrance}
Hover: ${pack.motion.hover}
Transition: ${pack.motion.transition}

DO
${pack.do.map((item) => `- ${item}`).join("\n")}

DON'T
${pack.dont.map((item) => `- ${item}`).join("\n")}
`.trim();
}
