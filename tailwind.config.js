// eslint-disable-next-line no-undef
module.exports = {
  future: {
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true,
  },
  purge: ['./components/**/*.{js,ts,jsx,tsx}', './pages/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        white: '#fafafa',
        'light-button-bg': '#ececec',
        'light-button': '#a5a5a5',
        'light-text': '#45433F',
        'light-aux-button': '#d3d3d3',
        'light-aux-text': '#A8A6A2',
        'dark-bg': '#1E2633',
        'dark-text': '#8299BB',
        'dark-text-note': '#d3dff2',
        'dark-button-bg': '#313A48',
        'dark-button': '#566375',
        'dark-aux-text': '#65768F',
        'dark-aux-button': '#526480',
        'light-dark-bg': '#212E42',
      },
      spacing: {
        72: '18rem',
        80: '20rem',
        84: '21rem',
        88: '22rem',
        96: '24rem',
        108: '27rem',
        120: '30rem',
      },
      backgroundImage: () => ({
        cover: "url('/cover.jpg')",
      }),
      screens: {
        'iphone-8': '375px',
        'iphone-8-plus': '413px',
        mac: '500px',
      },
    },
  },
  variants: {
    // all the following default to ['responsive']
    mixBlendMode: ['responsive'],
    backgroundBlendMode: ['responsive'],
    isolation: ['responsive'],
  },
}
