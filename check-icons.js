const fs = require('fs');
const path = require('path');
const lucidePath = path.join(__dirname, 'node_modules', 'lucide-react-native', 'dist', 'lucide-react-native.cjs.js');
// We just need to check if these keys exist in lucide
try {
  const lucide = require('lucide-react-native');
  const icons = ['Copy', 'Edit3', 'RefreshCw', 'Heart', 'Share2', 'Send', 'Maximize2', 'Check', 'Instagram', 'Facebook', 'Linkedin', 'Twitter'];
  icons.forEach(i => {
    console.log(i + ':', typeof lucide[i]);
  });
} catch(e) { console.error(e) }
