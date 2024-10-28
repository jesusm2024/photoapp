//
// app.get('/download/:assetid', async (req, res) => {...});
//
// downloads an asset from S3 bucket and sends it back to the
// client as a base64-encoded string.
//
const dbConnection = require('./database.js')
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { s3, s3_bucket_name, s3_region_name } = require('./aws.js');

exports.get_download = async (req, res) => {

  console.log("call to /download...");

  try {


    //
    // TODO
    //
    // MySQL in JS:
    //   https://expressjs.com/en/guide/database-integration.html#mysql
    //   https://github.com/mysqljs/mysql
    // AWS:
    //   https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html
    //   https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/getobjectcommand.html
    //   https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/
    //

    // Retrieve assetid, it is a parameter to the API 
    // function (URL paramter)
    assetid = req.params.assetid;

    console.log("/download: calling RDS for asset...");

    var sql = "SELECT * FROM assets WHERE assetid = ?";
    var params = [assetid];

    // Initialize return parameters
    // let user_id;
    // let asset_name;
    // let bucket_key;

    // Execute SQL
    dbConnection.query(sql, params, async(err, rows) => {
      // Error occurs during execution.
      if (err){
        throw(err);
      }
      // Asset id is invalid.
      else if(rows.length == 0) {
        res.status(400).json({
          "message": "no such asset...",
          "user_id": -1,
          "asset_name": "?",
          "bucket_key": "?",
          "data": []
        });
        return;
      }
      // Valid asset id.
      else {

        // Save values from query.
        let user_id = rows[0].userid;
        let asset_name = rows[0].assetname;
        let bucket_key = rows[0].bucketkey;

        console.log("/download: call to RDS finished...");

        // Inputs for command.
        const input = {
          "Bucket": s3_bucket_name,
          "Key": await bucket_key
        };

        // Create command to send to S3 client. 
        const command = new GetObjectCommand(input);
        // Call S3 to download asset
        console.log("/download: connecting to S3...");
        const s3_res = await s3.send(command);
        console.log("/download: successfully connected to S3...");

        // Convert to base64-encoded string.
        const datastr = await s3_res.Body.transformToString("base64");

        // Send response to client.
        console.log("/download: sending response...");
        res.status(200).json({
          "message": "success",
          "user_id": user_id,
          "asset_name": asset_name,
          "bucket_key": bucket_key,
          "data": datastr
        });
      }
    });

    // // if (bucket_key === undefined) throw new Error("Bucket key could not be retrieved, call to RDS unsuccesful.")

 
  
  }//try
  catch (err) {
    //
    // generally we end up here if we made a 
    // programming error, like undefined variable
    // or function:
    //
    res.status(400).json({
      "message": err.message,
      "user_id": -1,
      "asset_name": "?",
      "bucket_key": "?",
      "data": []
    });
  }//catch

}//get