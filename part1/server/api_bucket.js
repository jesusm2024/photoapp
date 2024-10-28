//
// app.get('/bucket?startafter=bucketkey', async (req, res) => {...});
//
// Retrieves the contents of the S3 bucket and returns the 
// information about each asset to the client. Note that it
// returns 12 at a time, use startafter query parameter to pass
// the last bucketkey and get the next set of 12, and so on.
//
const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { s3, s3_bucket_name, s3_region_name } = require('./aws.js');

exports.get_bucket = async (req, res) => {

  console.log("call to /bucket...");

  try {


    // throw new Error("TODO: /bucket/?startafter=bucketkey");

    //
    // TODO: remember, 12 at a time...  Do not try to cache them here, instead 
    // request them 12 at a time from S3
    //
    // AWS:
    //   https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html
    //   https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/listobjectsv2command.html
    //   https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/

    // Default 
    var bucketkey = "";

    // If startafter query parameter is found save the 
    // bucketkey.
    if (req.query.startafter) {
      bucketkey = req.query.startafter;
    }

    // Inputs for command.
    const input = {
      "Bucket": s3_bucket_name,
      // Limits the number of keys returned. 
      "MaxKeys": 12,
      "StartAfter": bucketkey
    };

    // Create command to send to S3 client.
    const command = new ListObjectsV2Command(input);
    // Call S3 to list buckets
    console.log("/download: connecting to S3...");
    const response = await s3.send(command);
    console.log("/download: successfully connected to S3...");

    // Store data to return.
    let data;

    // If KeyCount is 0 then Contents does not exist.
    if (response.KeyCount == 0){
      data = [];
    }
    // Contents exits. 
    else {
      data = response.Contents;
    }

    console.log("/bucket: sending response...");
    res.status(200).json({
      "message": "success",
      "data": data
    });

    // Promise.all([response])
    //   .then(() => {
        
    //     // Store data to return.
    //     var data;

    //     // If KeyCount is 0 then Contents does not exist.
    //     if (response.KeyCount == 0){
    //       data = [];
    //     }
    //     // Contents exits. 
    //     else {
    //       data = response.Contents;
    //     }
        
    //     res.status(200).json({
    //       "message": "success",
    //       "data": data
    //     });
    //   })
    //   .catch(err => {
    //     res.status(400).json({
    //       "message": err.message,
    //       "data:": []
    //     });
    //   });

  }//try
  catch (err) {
    res.status(400).json({
      "message": err.message,
      "data": []
    });
  }//catch

}//get
