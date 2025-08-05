export const CREATIVE_TYPES = [
  "Email",
  "Display",
  "Search",
  "Social",
  "Native",
  "Push",
] as const;

export const ACCEPTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

export const ACCEPTED_FILE_TYPES = ".png,.jpg,.jpeg,.html,.zip";

export const MAX_ZIP_DEPTH = 2;

export const RESPONSIVE_STYLE = `
  <style>
    body {
      margin: 0 !important;
      padding: 10px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      background-color: #f9fafb !important;
    }
    * {
      max-width: 100% !important;
      box-sizing: border-box !important;
    }
    img {
      max-width: 100% !important;
      height: auto !important;
      display: block !important;
    }
    iframe {
      max-width: 100% !important;
    }
    .bg {
      height: auto !important;
      width: 100% !important;
      max-width: 600px !important;
    }
  </style>
`;

export const DEFAULT_HTML_TEMPLATE = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body></body></html>`;

export const TELEGRAM_BOT_URL = "https://t.me/BigDropsMarketingBot?start=from_web_form";

export const FORM_STEPS = {
  PERSONAL_DETAILS: 1,
  CONTACT_DETAILS: 2,
  CREATIVE_DETAILS: 3,
} as const;

export const STEP_LABELS = {
  1: "Personal Details",
  2: "Contact Details", 
  3: "Creative Details",
} as const; 