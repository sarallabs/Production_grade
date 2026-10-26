const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'node_modules', 'react-native-youtube-iframe', 'src', 'YoutubeIframe.js');
const scriptsFile = path.join(__dirname, '..', 'node_modules', 'react-native-youtube-iframe', 'src', 'PlayerScripts.js');
const dtsFile = path.join(__dirname, '..', 'node_modules', 'react-native-youtube-iframe', 'index.d.ts');

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');
  if (!content.includes('playVideo: () => {')) {
    content = content.replace(
      /seekTo:\s*\(seconds,\s*allowSeekAhead\)\s*=>\s*\{[\s\S]*?\},/m,
      `seekTo: (seconds, allowSeekAhead) => {
        webViewRef.current.injectJavaScript(
          PLAYER_FUNCTIONS.seekToScript(seconds, allowSeekAhead),
        );
      },
      playVideo: () => {
        webViewRef.current?.injectJavaScript(
          'if (typeof player !== "undefined" && player.playVideo) { player.playVideo(); } true;',
        );
      },
      pauseVideo: () => {
        webViewRef.current?.injectJavaScript(
          'if (typeof player !== "undefined" && player.pauseVideo) { player.pauseVideo(); } true;',
        );
      },`
    );
    content = content.replace(
      /useEffect\(\(\)\s*=>\s*\{[\s\S]*?if\s*\(play\)\s*\{[\s\S]*?sendPostMessage\('playVideo',\s*\{\}\);[\s\S]*?\}\s*else\s*\{[\s\S]*?sendPostMessage\('pauseVideo',\s*\{\}\);[\s\S]*?\}\s*\},/m,
      `useEffect(() => {
    if (play) {
      sendPostMessage('playVideo', {});
      webViewRef.current?.injectJavaScript(
        'if (typeof player !== "undefined" && player.playVideo) { player.playVideo(); } true;',
      );
    } else {
      sendPostMessage('pauseVideo', {});
      webViewRef.current?.injectJavaScript(
        'if (typeof player !== "undefined" && player.pauseVideo) { player.pauseVideo(); } true;',
      );
    }
  },`
    );
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('[patch-youtube-iframe] Successfully patched YoutubeIframe.js');
  }
}

if (fs.existsSync(scriptsFile)) {
  let content = fs.readFileSync(scriptsFile, 'utf8');
  if (!content.includes("document.addEventListener('message', handleIncomingEvent);")) {
    content = content.replace(
      /window\.addEventListener\('message',\s*function\s*\(event\)\s*\{([\s\S]*?)\}\);/m,
      `function handleIncomingEvent(event) {$1}
      window.addEventListener('message', handleIncomingEvent);
      document.addEventListener('message', handleIncomingEvent);`
    );
    fs.writeFileSync(scriptsFile, content, 'utf8');
    console.log('[patch-youtube-iframe] Successfully patched PlayerScripts.js');
  }
}

if (fs.existsSync(dtsFile)) {
  let content = fs.readFileSync(dtsFile, 'utf8');
  if (!content.includes('pauseVideo?: () => void;')) {
    content = content.replace(
      /seekTo:\s*\(seconds:\s*number,\s*allowSeekAhead:\s*boolean\)\s*=>\s*void;/m,
      `seekTo: (seconds: number, allowSeekAhead: boolean) => void;\n  playVideo?: () => void;\n  pauseVideo?: () => void;`
    );
    fs.writeFileSync(dtsFile, content, 'utf8');
    console.log('[patch-youtube-iframe] Successfully patched index.d.ts');
  }
}
