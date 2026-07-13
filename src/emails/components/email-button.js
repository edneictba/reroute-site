const renderEmailButton = ({ href, label }) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto;">
    <tr>
      <td bgcolor="#16B8FF" style="border-radius: 10px; background: #16B8FF; background-image: linear-gradient(90deg, #16B8FF, #8BEA32);">
        <a href="${href}" target="_blank" rel="noopener" style="display: inline-block; min-width: 280px; padding: 16px 28px; color: #020817; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 20px; font-weight: 700; text-align: center; text-decoration: none; border-radius: 10px;">${label} &rarr;</a>
      </td>
    </tr>
  </table>
`;

module.exports = { renderEmailButton };
