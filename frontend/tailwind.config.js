/** @type {import('tailwindcss').Config} */
module.exports = {
  // tailwind'in hangi dosyaları tarayacağını belirtir (purge için zorunlu)
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // animate-in sınıfları için keyframe tanımları
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideInFromBottom: { from: { transform: 'translateY(16px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        blob: { '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' }, '33%': { transform: 'translate(30px, -50px) scale(1.1)' }, '66%': { transform: 'translate(-20px, 20px) scale(0.9)' } },
        zoomIn95: { from: { transform: 'scale(0.95)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
      },
      animation: {
        'blob': 'blob 7s infinite',
        'fade-in': 'fadeIn 0.5s ease forwards',
        'slide-in-from-bottom-4': 'slideInFromBottom 0.5s ease forwards',
        'zoom-in-95': 'zoomIn95 0.3s ease forwards',
      },
    },
  },
  plugins: [],
}
