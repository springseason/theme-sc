/**
 * Tailwind CSS configuration file
 *
 * docs: https://tailwindcss.com/docs/configuration
 * default: https://github.com/tailwindcss/tailwindcss/blob/master/stubs/defaultConfig.stub.js
 */
let plugin = require('tailwindcss/plugin');

module.exports = {
  mode: 'jit',
  content: [
    './layout/*.liquid',
    './sections/*.liquid',
    './snippets/*.liquid',
    './templates/*.liquid',
    './frontend/**/*.{js,jsx,ts,tsx}',
  ],
  safelist: ['skip-to-content-link'],
  theme: {
    container: {
      center: true,
      // padding: {
      //   DEFAULT: '1rem',
      //   sm: '2rem',
      // },
      screens: {
        sm: `640px`,
        md: `768px`,
        lg: `1024px`,
        xl: `1280px`,
        '2xl': `calc(1536px + 4rem)`,
      },
    },
    screens: {
      sm: '640px',
      // => @media (min-width: 640px) { ... }
      md: '768px',
      // => @media (min-width: 768px) { ... }
      lg: '1024px',
      // => @media (min-width: 1024px) { ... }
      xl: '1280px',
      // => @media (min-width: 1280px) { ... }
      '2xl': '1536px',
      // => @media (min-width: 1536px) { ... }
    },
    fontFamily: {
      sans: 'var(--font-body-family)',
      heading: 'var(--font-heading-family)',
    },
    extend: {
      colors: {
        default: {
          background: 'var(--default-bg)',
          'background-gradient': 'var(--default-gradient)',
          text: 'var(--default-text)',
          button: 'var(--default-button)',
          'button-label': 'var(--default-button-label)',
          'secondary-button-label': 'var(--default-sec-button-label)',
          shadow: 'var(--default-shadow)',
          hover: 'var(--default-hover)',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/container-queries'),
    require('@tailwindcss/typography')({
      className: 'rte',
    }),
    require('@tailwindcss/forms'),
    plugin(function ({ addVariant }) {
      addVariant('scrolled', '.scrolled &'),
        addVariant('mobile-menu-visible', '.mobile-menu-visible &');
    }),
  ],
};
