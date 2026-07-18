export type AddressError =
  | { code: 'PARTNER_NOT_FOUND'; partnerId: string }
  | { code: 'ADDRESS_NOT_FOUND'; addressId: string };

export const AddressErrors = {
  partnerNotFound: (partnerId: string): AddressError =>
    ({ code: 'PARTNER_NOT_FOUND', partnerId }),

  notFound: (addressId: string): AddressError =>
    ({ code: 'ADDRESS_NOT_FOUND', addressId }),
};
