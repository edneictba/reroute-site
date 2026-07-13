const renderEmailLayout = ({ preheader, children }) => `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="dark">
    <meta name="supported-color-schemes" content="dark">
    <title>Bem-vindo ao REROUTE</title>
  </head>
  <body style="margin: 0; padding: 0; background: #020817;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent; font-size: 1px; line-height: 1px;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#020817" style="background: #020817;">
      <tr>
        <td align="center" style="padding: 24px 12px;">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" bgcolor="#050B16" style="width: 100%; max-width: 640px; background: #050B16; border-collapse: collapse;">
            ${children}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

module.exports = { renderEmailLayout };
