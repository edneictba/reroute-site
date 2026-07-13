const { renderEmailLayout } = require('../components/email-layout');
const { renderEmailHeader } = require('../components/email-header');
const { renderEmailButton } = require('../components/email-button');
const { renderEmailFooter } = require('../components/email-footer');
const { escapeHtml } = require('../utils/escape-html');

const SUBJECT = 'Bem-vindo ao REROUTE. Sua rota começa aqui.';
const PREHEADER = 'Seu lugar na lista de espera foi reservado.';

const normalizeSiteUrl = (siteUrl = 'https://www.reroute.com.br') => String(siteUrl || 'https://www.reroute.com.br').replace(/\/+$/, '');

const renderStatusRow = ({ color, label, status }) => `
  <tr>
    <td style="padding: 10px 0; border-bottom: 1px solid #25344A;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="22" valign="top"><span style="display: inline-block; width: 13px; height: 13px; border: 2px solid ${color}; border-radius: 50%;"></span></td>
          <td style="font-family: Arial, Helvetica, sans-serif; color: #FFFFFF; font-size: 14px; line-height: 20px;">${label}</td>
          <td align="right" style="font-family: Arial, Helvetica, sans-serif; color: ${color}; font-size: 11px; line-height: 20px; font-weight: 700;">${status}</td>
        </tr>
      </table>
    </td>
  </tr>
`;

const renderNextStep = ({ number, text }) => `
  <td width="25%" valign="top" style="padding: 12px 10px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding-bottom: 12px;">
          <span style="display: inline-block; width: 48px; height: 48px; border: 1px solid #25344A; border-radius: 50%; color: #8BEA32; font-family: Arial, Helvetica, sans-serif; font-size: 18px; line-height: 48px; font-weight: 700; text-align: center;">${number}</span>
        </td>
      </tr>
      <tr>
        <td align="center" style="font-family: Arial, Helvetica, sans-serif; color: #FFFFFF; font-size: 14px; line-height: 21px;">${text}</td>
      </tr>
    </table>
  </td>
`;

const renderWelcomeEmail = ({ firstName = '', siteUrl = 'https://www.reroute.com.br' } = {}) => {
  const safeSiteUrl = normalizeSiteUrl(siteUrl);
  const logoUrl = `${safeSiteUrl}/assets/images/logo-reroute-hns-640.png`;
  const mapUrl = `${safeSiteUrl}/assets/images/hns-world-map-960.jpg`;
  const greeting = firstName ? `Olá, ${escapeHtml(firstName)}!` : 'Olá!';

  const children = `
    ${renderEmailHeader({ logoUrl })}
    <tr>
      <td style="padding: 0 28px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#071122" style="background: #071122; border: 1px solid #25344A; border-radius: 18px;">
          <tr>
            <td style="padding: 30px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="top" style="font-family: Arial, Helvetica, sans-serif; color: #FFFFFF;">
                    <h1 style="margin: 0 0 10px; font-size: 30px; line-height: 36px; letter-spacing: -0.02em;">Seu lugar está reservado.</h1>
                    <p style="margin: 0 0 24px; color: #8BEA32; font-size: 19px; line-height: 26px; font-weight: 700;">${greeting}</p>
                    <p style="margin: 0 0 14px; color: #FFFFFF; font-size: 16px; line-height: 25px;">Obrigado por entrar para a lista de espera do REROUTE.</p>
                    <p style="margin: 0 0 14px; color: #FFFFFF; font-size: 16px; line-height: 25px;">Você acaba de se juntar às primeiras pessoas que acompanharão a construção do primeiro <strong style="color: #16B8FF;">Human Navigation System</strong>.</p>
                    <p style="margin: 0 0 16px; color: #FFFFFF; font-size: 16px; line-height: 25px;">Assim como o GPS ajuda alguém a encontrar um caminho no mundo físico, o REROUTE está sendo desenvolvido para ajudar pessoas a navegar em direção aos próprios objetivos — mesmo quando a vida muda, surgem obstáculos ou a rota precisa ser recalculada.</p>
                    <p style="margin: 0; color: #8BEA32; font-size: 16px; line-height: 24px; font-weight: 700;">Seu cadastro foi confirmado e seu lugar na lista de espera está reservado.</p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 24px;">
                    <img src="${mapUrl}" width="520" alt="Mapa digital do Human Navigation System com rotas em azul e verde" style="display: block; width: 100%; max-width: 520px; height: auto; border: 0; border-radius: 14px;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 28px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#071122" style="background: #071122; border: 1px solid #25344A; border-radius: 18px;">
          <tr>
            <td style="padding: 24px;">
              <h2 style="margin: 0 0 12px; color: #8BEA32; font-family: Arial, Helvetica, sans-serif; font-size: 22px; line-height: 28px;">O que acontece agora?</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  ${renderNextStep({ number: '1', text: 'Sua vaga na lista de espera foi confirmada.' })}
                  ${renderNextStep({ number: '2', text: 'Você receberá novidades exclusivas sobre o desenvolvimento.' })}
                  ${renderNextStep({ number: '3', text: 'Será um dos primeiros convidados para testar o REROUTE.' })}
                  ${renderNextStep({ number: '4', text: 'Acompanhará a construção do primeiro Human Navigation System.' })}
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 28px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#091525" style="background: #091525; border: 1px solid #25344A; border-radius: 18px;">
          <tr>
            <td align="center" style="padding: 26px 24px;">
              <p style="margin: 0 0 20px; font-family: Arial, Helvetica, sans-serif; font-size: 24px; line-height: 32px; font-weight: 700;">
                <span style="color: #16B8FF;">Você define o destino.</span><br />
                <span style="color: #FFFFFF;">O REROUTE recalcula a rota quando a vida muda,</span><br />
                <span style="color: #8BEA32;">para que você continue avançando.</span>
              </p>
              ${renderEmailButton({ href: safeSiteUrl, label: 'Conhecer o REROUTE' })}
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 0 28px 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="50%" valign="top" style="padding: 0 8px 12px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#071122" style="background: #071122; border: 1px solid #25344A; border-radius: 18px;">
                <tr>
                  <td style="padding: 22px; font-family: Arial, Helvetica, sans-serif;">
                    <h2 style="margin: 0 0 14px; color: #8BEA32; font-size: 21px; line-height: 27px;">O que é o REROUTE?</h2>
                    <p style="margin: 0 0 12px; color: #FFFFFF; font-size: 15px; line-height: 23px;">Assim como o GPS ajuda você a chegar a um endereço, o REROUTE está sendo desenvolvido para ajudar pessoas a alcançar objetivos.</p>
                    <p style="margin: 0 0 12px; color: #FFFFFF; font-size: 15px; line-height: 23px;">Em vez de navegar por ruas, ele ajuda você a navegar pela vida.</p>
                    <p style="margin: 0; color: #FFFFFF; font-size: 15px; line-height: 23px;">Quando a vida muda, ele recalcula a rota para que você continue avançando.</p>
                  </td>
                </tr>
              </table>
            </td>
            <td width="50%" valign="top" style="padding: 0 0 12px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#071122" style="background: #071122; border: 1px solid #25344A; border-radius: 18px;">
                <tr>
                  <td style="padding: 22px; font-family: Arial, Helvetica, sans-serif;">
                    <h2 style="margin: 0 0 12px; color: #8BEA32; font-size: 21px; line-height: 27px;">Status do projeto</h2>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      ${renderStatusRow({ color: '#23D58B', label: 'Lista de espera aberta', status: 'ATIVO' })}
                      ${renderStatusRow({ color: '#23D58B', label: 'MVP em desenvolvimento', status: 'ATIVO' })}
                      ${renderStatusRow({ color: '#16B8FF', label: 'Beta fechado', status: 'PRÓXIMO' })}
                      ${renderStatusRow({ color: '#8290A8', label: 'Lançamento oficial', status: 'FUTURO' })}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${renderEmailFooter({ siteUrl: safeSiteUrl })}
    <!-- Um mecanismo real de unsubscribe será obrigatório antes do envio de campanhas recorrentes de marketing. Este e-mail é transacional e confirma o cadastro na lista de espera. -->
  `;

  return {
    subject: SUBJECT,
    preheader: PREHEADER,
    html: renderEmailLayout({ preheader: PREHEADER, children }),
    text: [
      SUBJECT,
      '',
      `${greeting}`,
      'Seu cadastro foi confirmado e seu lugar na lista de espera está reservado.',
      'Você define o destino. O REROUTE recalcula a rota quando a vida muda, para que você continue avançando.',
      safeSiteUrl
    ].join('\n')
  };
};

module.exports = {
  PREHEADER,
  SUBJECT,
  renderWelcomeEmail
};
