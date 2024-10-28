//
// app.post('/image/:userid', async (req, res) => {...});
//
// Uploads an image to the bucket and updates the database,
// returning the asset id assigned to this image.
//
const dbConnection = require('./database.js')
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { s3, s3_bucket_name, s3_region_name } = require('./aws.js');

const uuid = require('uuid');

// const s3_upload = async (command) => {
//   // const command = new PutObjectCommand({
//   //   Bucket: "test-bucket",
//   //   Key: "hello-s3.txt",
//   //   Body: "Hello S3!",
//   // });

//   try {
//     const response = await s3.send(command);
//     // console.log(response);
//   } catch (err) {
//     // console.error(err);
//   }
// };

exports.post_image = async (req, res) => {

  console.log("call to /image...");

  try {

    var data = req.body;  // data => JS object

    // Retrieve userid, it is a parameter to the API 
    // function (URL paramter)
    const userid = req.params.userid;

    console.log("userid:", userid)

    // Look for user with given userid in the users table. 
    var sql = "SELECT * FROM users WHERE userid=?;";
    var params = [userid];

    console.log("/image: calling RDS and looking for userid...");

    // Execute SQL
    dbConnection.query(sql, params, async (err, rows) => {
      // Error occurs during execution. 
      if (err) {
        throw (err);
      }
      // Given userid not found in the users table.
      else if (rows.length == 0) {
        console.log("/image: userid not found in users...");
        // Send response in JSON format:
        console.log("/image: sending response...");
        res.status(400).json({
          "message": "no such user...",
          "assetid": -1
        });
      }
      // Userid found so user already in database.
      else if (rows.length == 1){
        
        console.log("/image: user with given userid found in database...");

        // Save user (need the bucketfolder). 
        const user = rows;

        // Decode base64-encoded string image to send raw bytes to S3.
        var S = req.body.data;
        var bytes = Buffer.from(S, 'base64');

        // Use UUID to generate a unique bucket key for the image.
        let name = uuid.v4()

        // Prefix the key with the user’s bucket folder and “/”; assuming the 
        // file extension is “.jpg”.
        const key = user[0].bucketfolder + "/" + name + ".jpg";

        // Create command to send to S3.
        const command = new PutObjectCommand({
          Bucket: s3_bucket_name,
          Key: key,
          Body: bytes,
        });

        console.log("/image: uploading image to S3...");
        // Upload image to S3. 
        const response = await s3.send(command);

        // Update the assets table. 
        // Add image to assets. 
        // Insert new asset into the assets table.
        sql = `
          INSERT INTO assets (userid, assetname, bucketkey) 
          VALUES (?, ?, ?);
        `
        params = [user[0].userid, data.assetname, key];

        console.log("/image: adding image to assets...");

        // Execute SQL
        dbConnection.query(sql, params, (err, rows) => {
          // Error occurs during execution. 
          if (err) {
            throw (err);
          }
          else if (rows.affectedRows == 1) {
            console.log("image: new asset successfully added...");

            // Send response in JSON format:
            console.log("/image: sending response...");
            res.status(200).json({
              "message": "success",
              "assetid": rows.insertId
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
      "assetid": -1
    });
  }//catch

}//post
