document.getElementById('openOrbiex')?.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'FOCUS_ORBIEX' }, () => {
    window.close();
  });
});
