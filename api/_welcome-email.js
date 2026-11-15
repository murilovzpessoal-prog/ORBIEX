const DEFAULT_PASSWORD = 'orbiex2026k';
const SITE_URL = 'https://www.orbiex.io/';
const SUBJECT = 'Bem-vindo(a) à Orbiex — Seu acesso está liberado!';

function esc(s) {
  return String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function step(num, title, text) {
  return `
    <tr>
      <td style="padding:0 0 14px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#17110a;border:1px solid #2a2014;border-radius:14px;">
          <tr>
            <td width="56" valign="top" style="padding:18px 0 18px 18px;">
              <div style="width:34px;height:34px;line-height:34px;text-align:center;border-radius:50%;background-color:#d4af37;color:#000000;font-size:15px;font-weight:900;">${num}</div>
            </td>
            <td valign="top" style="padding:18px 18px 18px 8px;">
              <div style="font-size:15px;font-weight:800;color:#ffffff;margin-bottom:4px;">${title}</div>
              <div style="font-size:14px;line-height:1.55;color:#b9b1a3;">${text}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function renderTemplate(greetingHtml, emailHtml) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${SUBJECT}</title>
</head>
<body style="margin:0;padding:0;background-color:#050301;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#050301;padding:28px 12px;">
<tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;">

    <!-- Logo -->
    <tr><td align="center" style="padding:6px 0 22px 0;">
      <span style="font-size:26px;font-weight:900;letter-spacing:6px;color:#d4af37;text-transform:uppercase;">ORBIEX</span>
    </td></tr>

    <!-- Card -->
    <tr><td style="background-color:#0f0a04;border:1px solid #3a2d12;border-radius:24px;padding:0;overflow:hidden;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">

        <!-- Faixa dourada -->
        <tr><td style="height:5px;background:linear-gradient(90deg,#8a6d1c,#f3e2a4,#d4af37,#8a6d1c);font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Hero -->
        <tr><td align="center" style="padding:36px 28px 8px 28px;">
          <div style="display:inline-block;padding:6px 14px;border-radius:999px;background-color:#1d1608;border:1px solid #4a3a14;color:#f3e2a4;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">&#10003; Acesso liberado</div>
          <h1 style="margin:18px 0 10px 0;font-size:27px;line-height:1.25;font-weight:900;color:#ffffff;">${greetingHtml}</h1>
          <p style="margin:0;font-size:15px;line-height:1.6;color:#b9b1a3;">
            Sua compra foi confirmada e seu acesso à plataforma já está pronto para o e-mail
            <strong style="color:#f3e2a4;">${emailHtml}</strong>.
          </p>
        </td></tr>

        <!-- Botão -->
        <tr><td align="center" style="padding:26px 28px 8px 28px;">
          <a href="${SITE_URL}" target="_blank" style="display:inline-block;background-color:#d4af37;background:linear-gradient(90deg,#d4af37,#f3e2a4,#eab308);color:#000000;font-size:14px;font-weight:900;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:16px 38px;border-radius:12px;">Acessar a Orbiex &rarr;</a>
          <div style="margin-top:10px;font-size:12px;color:#7d7566;">ou acesse: <a href="${SITE_URL}" style="color:#d4af37;text-decoration:none;">www.orbiex.io</a></div>
        </td></tr>

        <!-- Título passo a passo -->
        <tr><td style="padding:30px 28px 14px 28px;">
          <div style="font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#d4af37;">Como acessar em 3 passos</div>
        </td></tr>

        <!-- Passos -->
        <tr><td style="padding:0 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            ${step(1, 'Entre no site', `Acesse <a href="${SITE_URL}" style="color:#d4af37;text-decoration:none;font-weight:700;">www.orbiex.io</a> pelo celular ou computador.`)}
            ${step(2, 'Preencha seus dados', `Digite seu <strong style="color:#ffffff;">nome</strong> e o <strong style="color:#ffffff;">mesmo e-mail usado na compra</strong>.`)}
            ${step(3, 'Crie sua primeira senha', `No campo de senha, digite a senha que você quer usar na sua conta e clique em <strong style="color:#ffffff;">&ldquo;Entrar na Plataforma&rdquo;</strong>.`)}
          </table>
        </td></tr>

        <!-- Bloco 4: senha padrão -->
        <tr><td style="padding:10px 28px 0 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#1a1406;border:1px solid #d4af37;border-radius:16px;">
            <tr><td style="padding:22px 22px 8px 22px;">
              <div style="font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#f3e2a4;">&#9888; Deu algum erro ao entrar?</div>
              <p style="margin:10px 0 0 0;font-size:14px;line-height:1.6;color:#e6dfd0;">
                Se por qualquer motivo a senha que você criou n&atilde;o funcionar, <strong style="color:#ffffff;">use a senha padr&atilde;o abaixo</strong> no campo de senha e entre normalmente:
              </p>
            </td></tr>
            <tr><td align="center" style="padding:10px 22px 22px 22px;">
              <div style="background-color:#050301;border:2px dashed #d4af37;border-radius:12px;padding:14px 10px;">
                <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#7d7566;margin-bottom:4px;">Senha padr&atilde;o</div>
                <div style="font-family:'Courier New',monospace;font-size:26px;font-weight:900;letter-spacing:3px;color:#f3e2a4;">${DEFAULT_PASSWORD}</div>
              </div>
            </td></tr>
          </table>
        </td></tr>

        <!-- Rodapé do card -->
        <tr><td align="center" style="padding:28px 28px 32px 28px;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:#8d8576;">Qualquer d&uacute;vida, &eacute; s&oacute; responder este e-mail ou falar com o suporte dentro da plataforma.</p>
        </td></tr>
      </table>
    </td></tr>

    <!-- Rodapé -->
    <tr><td align="center" style="padding:20px 10px 0 10px;">
      <p style="margin:0;font-size:11px;line-height:1.6;color:#5f584b;">&copy; 2026 Orbiex &mdash; Ecossistema de Intelig&ecirc;ncia Artificial.<br/>E-mail autom&aacute;tico enviado ap&oacute;s a confirma&ccedil;&atilde;o da sua compra.</p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

function buildWelcomeEmailHtml(buyerName, buyerEmail) {
  const first = esc((buyerName || '').trim().split(/\s+/)[0] || '');
  const email = esc(buyerEmail || 'seu e-mail da compra');
  const greeting = first ? `Bem-vindo(a) à Orbiex, ${first}!` : 'Bem-vindo(a) à Orbiex!';
  return renderTemplate(greeting, email);
}

function buildSupabaseDynamicTemplateHtml() {
  const dynamicGreeting =
    '{{ if .Data.first_name }}Bem-vindo(a) à Orbiex, {{ .Data.first_name }}!{{ else if .Data.full_name }}Bem-vindo(a) à Orbiex, {{ .Data.full_name }}!{{ else }}Bem-vindo(a) à Orbiex!{{ end }}';
  const dynamicEmail = '{{ .Email }}';
  return renderTemplate(dynamicGreeting, dynamicEmail);
}

module.exports = {
  buildWelcomeEmailHtml,
  buildSupabaseDynamicTemplateHtml,
  SUBJECT,
  DEFAULT_PASSWORD,
};
