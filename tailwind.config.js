/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    'bg-blue-50',
    'bg-purple-50',
    'bg-green-50',
    'bg-orange-50',
    'text-blue-600',
    'text-purple-600',
    'text-green-600',
    'text-orange-600',
    'border-blue-200',
    'border-purple-200',
    'border-green-200',
    'border-orange-200',
    'text-blue-500',
    'text-purple-500',
    'text-green-500',
    'text-orange-500',
  ],
};
