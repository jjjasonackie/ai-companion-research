// Maps common app names to emoji icons
const APP_ICON_MAP = {
  // Social
  '微信': '💬', 'wechat': '💬',
  '微博': '🐦', 'weibo': '🐦',
  '小红书': '📕', 'rednote': '📕',
  'instagram': '📸', 'ins': '📸',
  'twitter': '🐦', 'x': '🐦',
  'tiktok': '🎵', '抖音': '🎵',
  '快手': '🎬', '视频号': '📹',
  'facebook': '👥', 'messenger': '💌',
  'telegram': '✈️', 'whatsapp': '💚',
  'qq': '🐧', '钉钉': '🔔', '飞书': '🪶',

  // Entertainment
  'netflix': '🎬', '奈飞': '🎬',
  '哔哩哔哩': '📺', 'bilibili': '📺', 'b站': '📺',
  'youtube': '▶️',
  '爱奇艺': '🎭', '优酷': '🎭', '腾讯视频': '🎭',
  'spotify': '🎧', 'apple music': '🎵', 'netease music': '🎵', '网易云音乐': '🎵',

  // Games
  '王者荣耀': '⚔️', '原神': '✨', '和平精英': '🎯',
  '明日方舟': '🎮', '崩坏': '💫', '星铁': '🌟',
  'steam': '🎮', 'epic': '🎮', 'minecraft': '⛏️',

  // Productivity
  'chrome': '🌐', 'safari': '🧭', 'firefox': '🦊', 'edge': '🌐',
  'vscode': '💻', 'notion': '📝', 'obsidian': '💜',
  'figma': '🎨', 'photoshop': '🖼️', 'sketch': '✏️',
  '微信读书': '📚', 'kindle': '📖', '得到': '📖',

  // Shopping
  '淘宝': '🛍️', '天猫': '😺', '京东': '📦', '拼多多': '🍑',

  // Food
  '美团': '🛵', '饿了么': '🍜', '大众点评': '⭐',

  // Health / other
  '微信支付': '💳', '支付宝': '💰',
  'keep': '💪', '薄荷健康': '🥗',
  '百度地图': '🗺️', '高德地图': '🗺️',
};

export function getAppIcon(appName) {
  if (!appName) return '📱';
  const lower = appName.toLowerCase();
  for (const [key, icon] of Object.entries(APP_ICON_MAP)) {
    if (lower.includes(key.toLowerCase())) return icon;
  }
  return '📱';
}

export const COMMON_APPS = [
  '微信', '微博', '小红书', '抖音', '哔哩哔哩',
  '王者荣耀', '原神', '微信读书', '网易云音乐',
  '淘宝', '美团', '微信支付', 'Instagram', 'YouTube',
  '猫箱', 'Flai', '独响', 'Kindroid',
];
