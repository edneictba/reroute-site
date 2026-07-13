const renderEmailHeader = ({ logoUrl }) => `
  <tr>
    <td style="padding: 20px 28px 18px; border-bottom: 1px solid #25344A;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-family: Arial, Helvetica, sans-serif; color: #DCE6F7; font-size: 14px; line-height: 20px;">Bem-vindo ao REROUTE. Sua rota começa aqui.</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td align="center" style="padding: 28px 28px 18px;">
      <img src="${logoUrl}" width="260" alt="REROUTE - The First Human Navigation System" style="display: block; width: 260px; max-width: 86%; height: auto; border: 0;" />
    </td>
  </tr>
`;

module.exports = { renderEmailHeader };
