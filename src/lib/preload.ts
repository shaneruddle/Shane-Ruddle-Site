import type { ComponentType } from "react";

// Lazy page modules that main.tsx loaded before the app mounted. Rendering them directly
// (instead of through React.lazy) avoids a blank loading frame replacing the prerendered HTML.
export const preloaded: { BlogPage?: ComponentType<{ onBack: () => void }> } = {};
