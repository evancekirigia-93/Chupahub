export type DeliveryGuide = {
  heading: string;
  intro: string;
  questions: Array<{ question: string; answer: string }>;
};

const orderingQuestions = [
  { question: 'How do I check delivery to my Nairobi address?', answer: 'Enter your delivery address at checkout to review the applicable delivery fee and available options before placing your order. Contact Chupa Hub customer care to confirm timing if your order is time-sensitive.' },
  { question: 'Where can I find current prices and bottle sizes?', answer: 'Check the product listing and product page for the listed price in Kenyan shillings, available sizes and stock status. Review your basket and delivery fee at checkout for the order total.' },
  { question: 'Who can order alcohol from Chupa Hub?', answer: 'Alcohol orders are for adults aged 18 and over. Please drink responsibly.' },
];

export const deliveryGuides: Record<string, DeliveryGuide> = {
  '/alcohol-delivery-nairobi': {
    heading: 'How to order alcohol delivery in Nairobi',
    intro: 'Chupa Hub is an online drinks shop for Nairobi. Browse wine, beer, whisky, tequila, gin, vodka and mixers, choose available products, then enter your delivery address at checkout.',
    questions: orderingQuestions,
  },
  '/whisky': {
    heading: 'Choosing whisky and whiskey for Nairobi delivery',
    intro: 'Whisky and whiskey are spellings used for the same broad family of spirits. Scotch typically uses “whisky”; Irish and American producers often use “whiskey”. Compare the style, bottle size and listed price when choosing.',
    questions: [
      { question: 'What is the difference between Scotch and bourbon?', answer: 'Scotch whisky is made in Scotland. Bourbon is an American whiskey made with a mash containing at least 51% corn and aged in new charred oak containers. Check individual product descriptions for origin and style.' },
      ...orderingQuestions,
    ],
  },
  '/tequila': {
    heading: 'Choosing tequila for Nairobi delivery',
    intro: 'Compare tequila styles, bottle sizes and listed prices before ordering. Blanco is generally unaged or briefly rested, while reposado is aged in oak for at least two months and less than a year.',
    questions: [
      { question: 'How do I choose a tequila for cocktails?', answer: 'Blanco tequila is commonly used in margaritas and palomas. Reposado can add oak flavours. Check the label and product description for the tequila style and whether it is made from 100% agave.' },
      ...orderingQuestions,
    ],
  },
  '/beer': {
    heading: 'Choosing beer for Nairobi delivery',
    intro: 'Browse available beers and compare pack sizes, bottle or can volume and listed prices. Check whether a listing is for a single drink or a multipack before adding it to your basket.',
    questions: [
      { question: 'What should I compare when buying beer online?', answer: 'Compare the beer style, alcohol content where listed, container size, quantity per pack and price. Availability varies by product; use the product page to check the current options.' },
      ...orderingQuestions,
    ],
  },
  '/wine': {
    heading: 'Choosing wine for Nairobi delivery',
    intro: 'Explore available red, white, rosé and sparkling wines. Compare the grape variety, origin, bottle size and tasting notes where provided to find a wine suited to your meal or occasion.',
    questions: [
      { question: 'How do I choose between red, white and sparkling wine?', answer: 'Start with your preferred taste and occasion. Compare the tasting notes and sweetness information on each product page. Sparkling wines have bubbles; red, white and rosé wines come in a range of styles and sweetness levels.' },
      ...orderingQuestions,
    ],
  },
};
