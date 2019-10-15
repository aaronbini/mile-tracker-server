/**
 * Connect to the DB: mongo ds139939.mlab.com:39939/heroku_mqdvtz36 -u <dbuser> -p <dbpassword>
 * Paste the following query into the terminal, and modify the date range as needed
 * 
 */

db.movements.aggregate(
  [ 
    { $match: {
      $and: [
        { createdAt: { $gte: ISODate("2018-01-01T00:00:00.000Z") } },
        { createdAt: { $lte: ISODate("2018-12-31T00:00:00.000Z") } }
      ]
    } },
    { $group:   { _id: "$mode", total: { $sum: "$distance" } } }
  ]
)