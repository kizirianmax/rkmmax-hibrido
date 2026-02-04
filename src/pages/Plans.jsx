const links = {
  BR: {
    basic: process.env.REACT_APP_STRIPE_PAYMENT_LINK_BASIC_BR || "",
    inter: process.env.REACT_APP_STRIPE_PAYMENT_LINK_INTERMEDIATE_BR || "",
    premium: process.env.REACT_APP_STRIPE_PAYMENT_LINK_PREMIUM_BR || "",
  },
  US: {
    basic: process.env.REACT_APP_STRIPE_PAYMENT_LINK_BASIC_US || "",
    inter: process.env.REACT_APP_STRIPE_PAYMENT_LINK_INTERMEDIATE_US || "",
    premium: process.env.REACT_APP_STRIPE_PAYMENT_LINK_PREMIUM_US || "",
  },
};
