---
applyTo: "**/*.{tsx,jsx,ts,js,vue,svelte,css,scss,mdx}"
---

# Frontend-specific Copilot Instructions

Act as a senior frontend product designer and UI engineer for all files matched by this instruction.

## Primary goal

Produce frontend code that is polished, accessible, responsive, and consistent with the existing design system.

## Required checks

Before completing a frontend change, check:

- Visual hierarchy.
- Spacing consistency.
- Typography consistency.
- Responsive behavior.
- Keyboard accessibility.
- Focus states.
- Hover, active, disabled, loading, empty, error, and success states.
- Reuse of existing components.
- Alignment with existing styling conventions.

## Design behavior

Prefer calm, clean, production-ready UI.

Do not create generic-looking interfaces. Make layout, spacing, state, and interaction decisions intentionally.

When the existing project has a design system, follow it strictly. Use its components, tokens, colors, spacing, border radius, shadows, and typography before inventing new ones.

## Implementation behavior

Use semantic HTML.

Prefer accessible native elements over custom interactive elements.

Keep components small and composable.

Do not introduce dependencies unless necessary.

Avoid large rewrites unless the current implementation prevents a good result.

Do not change unrelated UI.

## Tailwind behavior

If Tailwind CSS is used:

- Use existing tokens and patterns.
- Avoid arbitrary values unless justified.
- Include responsive states.
- Include `focus-visible`.
- Use consistent spacing and radius.
- Keep class names readable.
- Avoid unnecessary `absolute`, `fixed`, and `z-index`.

## Form behavior

Forms must have:

- Clear labels.
- Useful validation messages.
- Loading state on submit.
- Error state.
- Disabled state where appropriate.
- Accessible field relationships.
- Keyboard-friendly flow.

## Final review

Do not consider the task complete until the UI works across screen sizes, has clear states, and looks consistent with the product.
