/**
 * Copia texto para a área de transferência com fallback para navegadores
 * sem Clipboard API (http, iframes, Safari antigo, permissões negadas).
 */
export async function copyText(text: string): Promise<boolean> {
  const value = String(text ?? '');
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* cai no fallback */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = value;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    ta.style.left = '-9999px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    const selection = document.getSelection();
    const prevRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    ta.select();
    ta.setSelectionRange(0, value.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    if (prevRange && selection) {
      selection.removeAllRanges();
      selection.addRange(prevRange);
    }
    return ok;
  } catch {
    return false;
  }
}
