export type ContactError =
  | { code: 'PARTNER_NOT_FOUND'; partnerId: string }
  | { code: 'CONTACT_NOT_FOUND'; contactId: string };

export const ContactErrors = {
  partnerNotFound: (partnerId: string): ContactError =>
    ({ code: 'PARTNER_NOT_FOUND', partnerId }),

  notFound: (contactId: string): ContactError =>
    ({ code: 'CONTACT_NOT_FOUND', contactId }),
};
