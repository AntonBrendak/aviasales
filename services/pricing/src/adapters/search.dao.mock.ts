export const SearchDAO = {
  async getOffer(searchSessionId: string, offerId: string) {
    if (searchSessionId === '11111111-1111-1111-1111-111111111111' && offerId === 'OF1') {
      return {
        id: 'OF1',
        fareFamily: 'Standard',
        price: {
          base: { amount: '120.00', currency: 'EUR' },
          taxes: [{ amount: '24.00', currency: 'EUR' }, { amount: '6.00', currency: 'EUR' }],
          carrierFees: [{ amount: '8.00', currency: 'EUR' }]
        },
        ancPrice: { BAG20: { amount: 20 }, SEATSTD: { amount: 8 } }
      };
    }
    // для реальной интеграции заменить на HTTP-клиент к сервису search
    throw new Error('Offer not found in mock DAO');
  }
};
