//
// app.get('/download/:assetid', async (req, res) => {...});
//
// return some stats about our bucket and database:
//
const dbConnection = require('./database.js')
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { s3, s3_bucket_name, s3_region_name } = require('./aws.js');

exports.get_download = async (req, res) => {

  console.log("call to /download...");

  // throw new Error("TODO: /download/:assetid");

  try {

    var assetid = parseInt(req.params.assetid);

    //
    // calling RDS to lookup asset id:
    //
    // SQL ref: https://github.com/mysqljs/mysql#escaping-query-values
    //
    var rds_response = new Promise((resolve, reject) => {

      console.log("/download: calling RDS to lookup asset id:", assetid);

      var sql = `
      select * from assets
      where assetid = ?;
      `;

      dbConnection.query(sql, [assetid], (err, result, _) => {
        if (err) {
          reject(err);
          return;
        }

        console.log("/download query done");
        resolve(result);
      });
    });

    //
    // wait for query to resolve since we need the bucket key:
    //
    var result = await rds_response;

    // console.log(result);

    if (result.length == 0) {
      res.status(400).json({
        "message": "no such asset...",
        "user_id": -1,
        "asset_name": "?",
        "bucket_key": "?",
        "data": []
      });

      return;
    }

    //
    // asset id is valid, we have an image to download. Extract
    // values from DB query, we need the bucket key:
    //
    var row = result[0];

    var userid = row["userid"];
    var assetname = row["assetname"];
    var bucketkey = row["bucketkey"];

    //
    // now let's download the image from S3:
    //
    // S3 ref:
    //  https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html
    //  https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/getobjectcommand.html
    //

    //
    // build input object with request parameters:
    //
    var input = {
      Bucket: s3_bucket_name,
      Key: bucketkey
    };

    //
    // calling S3 to get bucket status, returning a PROMISE
    // we have to wait on eventually:
    //
    console.log("/download: calling S3...");

    var command = new GetObjectCommand(input);
    var s3_response = s3.send(command);

    var result = await s3_response;  // wait for it...

    //
    // we have the image in raw bytes, now transform it into 
    // base-64 string so we can transmit to client:
    //
    console.log("/download of image done, transforming to string...");

    var datastr = await result.Body.transformToString("base64");

    console.log("/download transform done, string length:", datastr.length);

    //
    // done, send response:
    //
    console.log("/download done, sending response...");

    res.json({
      "message": "success",
      "user_id": userid,
      "asset_name": assetname,
      "bucket_key": bucketkey,
      "data": datastr
    });

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