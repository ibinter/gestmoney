export function campagneTemplate(
  sujet: string,
  corps: string,
  lienDesinscription: string,
): string {
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${sujet}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
            style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:#0a2e15;padding:24px 32px;text-align:center;">
                <img src="https://gestmoney.ibigsoft.com/logo.png" height="40" alt="GESTMONEY"
                  style="display:inline-block;" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px 24px;font-size:15px;line-height:1.7;">
                ${corps}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
                IBIG Soft · Abidjan, Côte d'Ivoire · gestmoney@ibigsoft.com<br/>
                <a href="${lienDesinscription}" style="color:#6b7280;">Se désinscrire</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
