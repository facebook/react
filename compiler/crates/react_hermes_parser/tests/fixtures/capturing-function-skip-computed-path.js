function StoreLandingUnseenGiftModalContainer(a) {
  const giftsSeen = { a };
  return ((gift) => (gift.id ? giftsSeen[gift.id] : false))();
}
