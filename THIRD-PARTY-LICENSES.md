# Third-Party Licenses

VibeLink uses the following third-party libraries and components. This document is provided for transparency and to help track license obligations.

## Production Dependencies

### @base-ui/react v1.6.0
- **License**: MIT
- **Purpose**: Accessible UI primitives (Dialog, Menu, etc.)
- **Repository**: https://github.com/mui/base-ui

### @supabase/ssr v0.12.4
- **License**: MIT
- **Purpose**: Supabase server-side rendering utilities
- **Repository**: https://github.com/supabase/supabase-js

### @supabase/supabase-js v2.111.0
- **License**: MIT
- **Purpose**: Supabase JavaScript client
- **Repository**: https://github.com/supabase/supabase-js

### class-variance-authority v0.7.1
- **License**: MIT
- **Purpose**: Utility for creating variant-based component styles
- **Repository**: https://github.com/joe-bell/cva

### clsx v2.1.1
- **License**: MIT
- **Purpose**: Utility for constructing className strings
- **Repository**: https://github.com/lukeed/clsx

### framer-motion v12.43.0
- **License**: MIT
- **Purpose**: Animation library for React
- **Repository**: https://github.com/framer/motion

### html5-qrcode v2.3.8
- **License**: Apache-2.0
- **Purpose**: QR code scanning library
- **Repository**: https://github.com/mebjas/html5-qrcode

### lucide-react v1.28.0
- **License**: MIT
- **Purpose**: Icon library
- **Repository**: https://github.com/lucide-icons/lucide

### next v16.3.8
- **License**: MIT
- **Purpose**: React framework
- **Repository**: https://github.com/vercel/next.js

### qrcode.react v4.2.0
- **License**: MIT
- **Purpose**: QR code generation for React
- **Repository**: https://github.com/zpao/qrcode.react

### react v19.2.4
- **License**: MIT
- **Purpose**: React library
- **Repository**: https://github.com/facebook/react

### react-dom v19.2.4
- **License**: MIT
- **Purpose**: React DOM renderer
- **Repository**: https://github.com/facebook/react

### shadcn v4.16.0
- **License**: MIT
- **Purpose**: CLI for shadcn/ui components
- **Repository**: https://ui.shadcn.com

### tailwind-merge v3.6.0
- **License**: MIT
- **Purpose**: Utility for merging Tailwind CSS classes
- **Repository**: https://github.com/dcastilho/tailwind-merge

### tailwindcss v4.3.3
- **License**: MIT
- **Purpose**: CSS framework
- **Repository**: https://github.com/tailwindlabs/tailwindcss

### tw-animate-css v1.4.0
- **License**: MIT
- **Purpose**: Tailwind CSS animations
- **Repository**: https://github.com/rodrigodiez/tw-animate-css

## Development Dependencies

### @tailwindcss/postcss v4.3.3
- **License**: MIT
- **Purpose**: Tailwind CSS PostCSS plugin
- **Repository**: https://github.com/tailwindlabs/tailwindcss

### @types/node v20.19.43
- **License**: MIT
- **Purpose**: TypeScript type definitions for Node.js
- **Repository**: https://github.com/DefinitelyTyped/DefinitelyTyped

### @types/react v19.2.17
- **License**: MIT
- **Purpose**: TypeScript type definitions for React
- **Repository**: https://github.com/DefinitelyTyped/DefinitelyTyped

### @types/react-dom v19.2.3
- **License**: MIT
- **Purpose**: TypeScript type definitions for React DOM
- **Repository**: https://github.com/DefinitelyTyped/DefinitelyTyped

### eslint v9.39.5
- **License**: MIT
- **Purpose**: JavaScript linter
- **Repository**: https://github.com/eslint/eslint

### eslint-config-next v16.2.12
- **License**: MIT
- **Purpose**: ESLint configuration for Next.js
- **Repository**: https://github.com/vercel/next.js

### typescript v5.9.3
- **License**: Apache-2.0
- **Purpose**: TypeScript compiler
- **Repository**: https://github.com/microsoft/TypeScript

## Fonts

### Google Fonts (Sora, Inter)
- **License**: Open Font License (OFL)
- **Purpose**: Web fonts
- **Repository**: https://fonts.google.com

## License Summary

Most dependencies use permissive licenses:
- **MIT License**: Allows commercial use, modification, distribution, and private use. Requires license and copyright notice.
- **Apache-2.0 License**: Similar to MIT with patent grant provisions.
- **Open Font License (OFL)**: Allows use, study, modification, and redistribution of fonts.

## Attribution

All third-party libraries are properly attributed via package.json and this document. No additional attribution is required for the licenses listed above, but this document is maintained for transparency.

## Note

This document is generated based on the current `package.json` and `package-lock.json`. For a complete and up-to-date list of all dependencies including transitive dependencies, run:

```bash
npm list --all
```

For detailed license information, see the LICENSE file in each package's node_modules directory.
