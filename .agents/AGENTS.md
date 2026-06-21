# Project Rules & Base Configuration

## Main Object Baseline
- **Baseline Codebase**: The project's main baseline is locked to the modern AI SaaS UI refactoring matching commit `125ccc3` (Vercel deployment `CzMq1PRGrNiZw3h5BuC29HsExF5U`).
- **Core Views**: Maintain the `landing` and `workbench` routing views along with `/assistant` (AI Assistant) and `/ai-lab` (AI Lab 工坊).
- **Theme**: The default and core aesthetic is the glassmorphic dark theme (Vercel/OpenAI style). Do not remove or degrade the AI assistant interfaces or related views when making modifications.
- **Future Changes**: Any future bug fixes, layout enhancements, or mobile adaptations must be applied directly on top of this stable `125ccc3` baseline without replacing or breaking the core AI features.
