//
// app.get('/users', async (req, res) => {...});
//
// Return all the users from the database:
//
const dbConnection = require('./database.js')

exports.get_users = async (req, res) => {

  console.log("call to /users...");

  try {

    //
    // TODO: remember we did an example similar to this in class with
    // movielens database (lecture 05 on Thursday 04-13)
    //
    // MySQL in JS:
    //   https://expressjs.com/en/guide/database-integration.html#mysql
    //   https://github.com/mysqljs/mysql
    //

    var sql = "SELECT * FROM users ORDER BY userid ASC;";
    var params = [];

     console.log("/users: calling RDS for users...");
    
    // Execute SQL
    dbConnection.query(sql, params, (err, rows) => {
      // Error occurs during execution. 
      if (err) {
        throw(err);
      }
      // Send response in JSON format:
      console.log("/users: sending response...");
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
