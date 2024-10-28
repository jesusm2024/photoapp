//
// app.put('/user', async (req, res) => {...});
//
// Inserts a new user into the database, or if the
// user already exists (based on email) then the
// user's data is updated (name and bucket folder).
// Returns the user's userid in the database.
//
const dbConnection = require('./database.js')

exports.put_user = async (req, res) => {

  console.log("call to /user...");

  try {

    var data = req.body;  // data => JS object

    console.log(data);

    // Look for given email in the users table. 
    var sql = "SELECT * FROM users WHERE email=?;";
    var params = [data.email];

    console.log("/user: calling RDS and looking for user email...");

    // Execute SQL
    dbConnection.query(sql, params, (err, rows) => {
      // Error occurs during execution. 
      if (err) {
        throw (err);
      }

      // Given email not found in the users table.
      else if (rows.length == 0) {

        console.log("/user: email not found in users...");

        // Insert new user into the users table.
        sql = `
          INSERT INTO users (email, lastname, firstname, bucketfolder) 
          VALUES (?, ?, ?, ?);
        `
        params = [data.email, data.lastname, data.firstname, data.bucketfolder];

        console.log("/user: inserting new user into database...");

        // Execute SQL
        dbConnection.query(sql, params, (err, rows) => {
          // Error occurs during execution. 
          if (err) {
            throw (err);
          }
          if (rows.affectedRows == 1) {
            console.log("user: inserted new user into database successfully...");


            // Send response in JSON format:
            console.log("/user: sending response...");
            res.status(200).json({
              "message": "inserted",
              "userid": rows.insertId
            });
          }
        });
      }
      // Email found so user is already in the database. 
      else if (rows.length == 1) {

        console.log("/user: user found in database...");

        // Save user (used to return userid). 
        const user = rows;

        // Insert new user into the users table.
        sql = `
          UPDATE users
          SET lastname=?, firstname=?, bucketfolder=?
          WHERE email=?;
        `
        params = [data.lastname, data.firstname, data.bucketfolder, data.email];

        console.log("/user: updating user information...");

        // Execute SQL
        dbConnection.query(sql, params, (err, rows) => {
          // Error occurs during execution. 
          if (err) {
            throw (err);
          }
          else if (rows.affectedRows == 1) {
            console.log("user: user information successfully updated...");

            // Send response in JSON format:
            console.log("/user: sending response...");
            res.status(200).json({
              "message": "updated",
              "userid": user[0].userid
            });
          }
        });

      }
    });
  }//try
  catch (err) {
    console.log("**ERROR:", err.message);

    res.status(400).json({
      "message": err.message,
      "userid": -1
    });
  }//catch

}//put
