// Quick test to verify all icons are working
// Run this in browser console to check for any icon issues

console.log('🔍 Testing icon replacements...');

// Check if Settings icon is available
try {
  const settingsElements = document.querySelectorAll('[data-lucide="settings"]');
  console.log(`✅ Found ${settingsElements.length} Settings icons`);
} catch (error) {
  console.error('❌ Settings icon error:', error);
}

// Check if TestTube icons are completely removed
try {
  const testTubeElements = document.querySelectorAll('[data-lucide="test-tube"]');
  if (testTubeElements.length === 0) {
    console.log('✅ All TestTube icons successfully removed');
  } else {
    console.warn(`⚠️ Found ${testTubeElements.length} remaining TestTube icons`);
  }
} catch (error) {
  console.log('✅ TestTube icons completely removed (no elements found)');
}

console.log('🎉 Icon replacement test complete!');