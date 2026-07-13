const renderEmailFooter = ({ siteUrl }) => `
  <tr>
    <td style="padding: 24px 28px 32px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 2px solid #16B8FF;">
        <tr>
          <td style="padding-top: 18px; font-family: Arial, Helvetica, sans-serif; color: #B8C4D9; font-size: 13px; line-height: 20px;">
            <strong style="color: #FFFFFF;">REROUTE — Human Navigation System</strong><br />
            Navegando a vida. Sempre existe um próximo passo.<br />
            <a href="${siteUrl}" target="_blank" rel="noopener" style="color: #16B8FF; text-decoration: none;">www.reroute.com.br</a><br />
            <a href="mailto:contato@reroute.com.br" style="color: #16B8FF; text-decoration: none;">contato@reroute.com.br</a>
          </td>
        </tr>
        <tr>
          <td style="padding-top: 18px; font-family: Arial, Helvetica, sans-serif; color: #8290A8; font-size: 12px; line-height: 18px; text-align: center;">
            Você recebeu este e-mail porque entrou na lista de espera do REROUTE.<br />
            &copy; 2026 REROUTE. Todos os direitos reservados.
          </td>
        </tr>
      </table>
    </td>
  </tr>
`;

module.exports = { renderEmailFooter };
