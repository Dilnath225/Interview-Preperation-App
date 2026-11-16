const fs = require('fs');
const path = require('path');

// 1. Copy fonts
const fontsDir = path.join(__dirname, '../frontend/dist/fonts');
if (!fs.existsSync(fontsDir)) fs.mkdirSync(fontsDir, { recursive: true });

const srcFontsDir = path.join(__dirname, '../frontend/dist/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts');
if (fs.existsSync(srcFontsDir)) {
  fs.readdirSync(srcFontsDir).forEach(f => {
    const baseName = f.split('.')[0];
    fs.copyFileSync(path.join(srcFontsDir, f), path.join(fontsDir, baseName + '.ttf'));
    fs.copyFileSync(path.join(srcFontsDir, f), path.join(fontsDir, f));
  });
}

// 2. Copy apple icon
const iconSrc = path.join(__dirname, '../frontend/assets/icon.png');
const iconDest = path.join(__dirname, '../frontend/dist/apple-touch-icon.png');
if (fs.existsSync(iconSrc)) {
  fs.copyFileSync(iconSrc, iconDest);
}

// 3. Inject styles
const indexPath = path.join(__dirname, '../frontend/dist/index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const fontStyles = `
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="AI Mentor" />
    <meta name="theme-color" content="#0A0E14" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <style id="expo-vector-fonts">
      @font-face { font-family: 'Ionicons'; src: url('/fonts/Ionicons.ttf') format('truetype'); }
      @font-face { font-family: 'MaterialCommunityIcons'; src: url('/fonts/MaterialCommunityIcons.ttf') format('truetype'); }
      @font-face { font-family: 'Material Icons'; src: url('/fonts/MaterialIcons.ttf') format('truetype'); }
      @font-face { font-family: 'MaterialIcons'; src: url('/fonts/MaterialIcons.ttf') format('truetype'); }
      @font-face { font-family: 'FontAwesome'; src: url('/fonts/FontAwesome.ttf') format('truetype'); }
      @font-face { font-family: 'FontAwesome5_Solid'; src: url('/fonts/FontAwesome5_Solid.ttf') format('truetype'); }
      @font-face { font-family: 'FontAwesome5_Regular'; src: url('/fonts/FontAwesome5_Regular.ttf') format('truetype'); }
      @font-face { font-family: 'FontAwesome5_Brands'; src: url('/fonts/FontAwesome5_Brands.ttf') format('truetype'); }
      @font-face { font-family: 'Feather'; src: url('/fonts/Feather.ttf') format('truetype'); }
      @font-face { font-family: 'AntDesign'; src: url('/fonts/AntDesign.ttf') format('truetype'); }
      @font-face { font-family: 'Entypo'; src: url('/fonts/Entypo.ttf') format('truetype'); }
      @font-face { font-family: 'Octicons'; src: url('/fonts/Octicons.ttf') format('truetype'); }
      * { -webkit-tap-highlight-color: transparent; }
      button, a, [role="button"] {
        transition: transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.15s ease;
      }
      button:active, [role="button"]:active {
        transform: scale(0.975);
      }
    </style>
`;

if (!html.includes('id="expo-vector-fonts"')) {
  html = html.replace('</head>', fontStyles + '</head>');
  fs.writeFileSync(indexPath, html, 'utf8');
}
console.log('Successfully prepared dist with animations, fonts & PWA assets');
