# LekhyaAI

## Current State
- Settings page has: Business Profile edit form (name, GSTIN, state, address), My Businesses list with switch/delete, Create Business modal, Delete confirm dialog.
- No color theme selector, no logo upload, no signature upload.
- AI Assistant uses a rule-based `queryAI` backend call -- no real LLM connection.
- `index.css` defines OKLCH tokens for light and dark modes. Dark mode is applied via `.dark` class on `<html>`.

## Requested Changes (Diff)

### Add
1. **Color Themes module** in Settings -- a panel with preset theme options (e.g. Teal, Saffron, Purple, Emerald, Rose, Slate). Each theme overrides `--primary`, `--secondary`, `--accent`, and derived sidebar tokens. Selection persists in `localStorage` and is applied at app startup by writing CSS variable overrides on `:root`. Include a live preview swatch per theme.
2. **Dark/Light mode toggle** in the Color Themes panel -- switches the `.dark` class on `<html>` and persists to `localStorage`.
3. **Company Logo upload** in Settings -- file input accepting image files (PNG/JPG/SVG). Stored as a base64 data URL in `localStorage` under key `lekhya_logo`. Displayed in the sidebar/nav area replacing or supplementing the text logo, and shown as a preview in Settings.
4. **Signature upload** in Settings -- file input accepting image files. Stored as base64 data URL in `localStorage` under key `lekhya_signature`. Preview shown in Settings. (Used on invoice PDF in future; stored only for now.)
5. **"AI Powered by" notice** in AI Assistant page -- since real LLM is not available on this platform, show a clear notice in the AI Assistant explaining this is a rule-based GST engine, and style the chat header with an "AI Powered" badge that looks premium.

### Modify
- `SettingsPage.tsx` -- add three new sections below existing content: (1) Color Themes, (2) Company Logo & Signature uploads. Each section is a card consistent with existing card style.
- `App.tsx` or `main.tsx` -- on app init, read `lekhya_theme` and `lekhya_dark` from `localStorage` and apply theme tokens + dark class before first render to avoid flash.
- `AiAssistantPage.tsx` -- add "AI Powered Rule Engine" badge/header treatment and a small info banner explaining it uses GST rule logic.
- Sidebar / AppLayout -- if a logo is stored in `lekhya_logo`, show the image instead of the text brand mark.

### Remove
- Nothing removed.

## Implementation Plan
1. Create `ThemeContext.tsx` in `src/frontend/src/context/` -- manages theme (preset name), dark mode, logo URL, and signature URL. Reads/writes localStorage. Exposes `setTheme`, `toggleDark`, `setLogo`, `setSignature`.
2. Define `THEMES` constant -- array of theme objects with name, label, and OKLCH token overrides for `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--accent`, `--accent-foreground`, `--ring`, sidebar tokens. Apply as inline CSS vars on `:root` via `useEffect`.
3. Wrap `App.tsx` with `ThemeProvider`. Apply dark class and theme tokens early (in provider mount effect).
4. Update `SettingsPage.tsx` -- add **Color Themes** section (grid of theme swatches, dark mode toggle switch) and **Branding** section (logo upload with preview, signature upload with preview).
5. Update `AppLayout` (sidebar/nav) -- consume `ThemeContext` for logo display.
6. Update `AiAssistantPage.tsx` -- add AI badge and info banner.
7. All new UI elements get appropriate `data-ocid` markers.
