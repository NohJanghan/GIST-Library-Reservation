require("dotenv").config({
  path: `.env.${process.env.NODE_ENV}`,
})

/**
 * @type {import('gatsby').GatsbyConfig}
 */
module.exports = {
  siteMetadata: {
    title: `GIST Library Reservation`,
    siteUrl: `https://www.yourdomain.tld`,
  },
  plugins: [],
}
