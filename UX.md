# UX & Technology Stack Guidance for do-callme

This document outlines the technology stack, design system, and user experience principles for the **do-callme** project. It combines modern, performant technologies with a premium, minimalist aesthetic.

---

## 1. Technology Stack

We have selected a modern, performant, and highly customizable stack for the web interface.

### Core Frameworks
- **Next.js**: React Framework using App Router for routing, server components, and excellent performance.
- **Tailwind CSS (v4)**: Utility-first CSS framework for rapid styling with modern CSS-first configuration.

### UI & Accessibility
- **Shadcn UI**: Component library providing premium, accessible, and highly customizable components (copy-paste model).
- **Radix UI**: Accessible primitives used under the hood by Shadcn UI for components like dialogs and dropdowns.

---

## 2. UX Philosophy

Our design philosophy is heavily inspired by **Apple-style minimalism**, focusing on clarity, fluidity, and high fidelity.

- **Minimalism**: High contrast, clean typography, generous whitespace, and subtle depth. Avoid clutter and unnecessary borders.
- **Focus & Context**: Enable users to collapse or hide sections to focus on their current task.
- **Fluid Interactions**: Use micro-animations, hover effects, and smooth transitions to make the interface feel responsive and alive.

---

## 3. Design Tokens (Tailwind CSS)

### Colors
- **Main Background**: `#F5F5F7` (Classic Apple light gray).
- **Card Background**: `rgba(255, 255, 255, 0.8)` with `backdrop-blur-md` (Glassmorphism effect).
- **Primary Text**: `#1D1D1F` (Deep dark gray, softer than pure black, high contrast).
- **Secondary Text**: `text-zinc-500` or `text-zinc-600` for metadata and labels.
- **Accents**: Blue (`text-blue-600`, `bg-blue-600`) for interactive elements and primary actions.

### Typography
- **Font Family**: A clean system font stack prioritizing legibility:
  ```css
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  ```
- **Numerical Data**: Always use **monospace** (`font-mono`) for clocks, timers, stopwatches, and data tables to prevent layout shifting as numbers change.
- **Headings**: Large, bold, and slightly compressed (`tracking-tight`) for a modern look.

---

## 4. UI Patterns & Component Best Practices

### The "Glass" Card
All main widgets and panels should use a semi-transparent glass look that blends with the background.
- **Tailwind Classes**: `border border-zinc-200 bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300`

### Modals & Dialogs (using Shadcn Dialog)
When user input is required:
- Use Shadcn `Dialog` component.
- Customize the background to use the glassmorphism effect but with higher opacity (`bg-white/90`) to stand out.
- Follow hierarchy: Add actions at top, Search/Filter in middle, Scrollable list at bottom.

### Component Library (Shadcn) Recommendations
To achieve the Apple minimalism look with Shadcn:
- Use `Button` with `variant="outline"` or `variant="ghost"` for a clean look.
- Use `Card` component but override the background with the Glass Card styles.
- Use `Dialog` for modals, ensuring the overlay has a subtle blur (`backdrop-blur-sm`).
