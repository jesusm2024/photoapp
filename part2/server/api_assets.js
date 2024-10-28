//
// app.get('/assets', async (req, res) => {...});
//
// Return all the assets from the database:
//
const dbConnection = require('./database.js')

exports.get_assets = async (req, res) => {

  console.log("call to /assets...");

  try {

    //
    // TODO: remember we did an example similar to this in class with
    // movielens database (lecture 05 on Thursday 04-13)
    //
    // MySQL in JS:
    //   https://expressjs.com/en/guide/database-integration.html#mysql
    //   https://github.com/mysqljs/mysql
    //
    var sql = "SELECT * FROM assets ORDER BY assetid ASC;";
    var params = [];

    console.log("/assets: calling RDS for assets...");
    
    // Execute SQL
    dbConnection.query(sql, params, (err, rows) => {
      // Error occurs during execution. 
      if (err) {
       throw(err);
      }

      // Send response in JSON format:
      console.log("/asset: sending response...");
      res.status(200).json({
        "message": "success",
        "data": rows
      });
    });
    
  }//try
  catch (err) {
    res.status(400).json({
      "message": err.message,
      "data": []
    });
  }//catch

}//get
