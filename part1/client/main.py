#
# Client-side python app for photoapp, this time working with
# web service, which in turn uses AWS S3 and RDS to implement
# a simple photo application for photo storage and viewing.
#
# Project 02 for CS 310
#
# Authors:
#   Jesus Montero
#   Prof. Joe Hummel (initial template)
#   Northwestern University
#   CS 310
#

import requests  # calling web service
import jsons  # relational-object mapping

import uuid
import pathlib
import logging
import sys
import os
import base64

from configparser import ConfigParser

import matplotlib.pyplot as plt
import matplotlib.image as img


###################################################################
#
# classes
#
class User:
  userid: int  # these must match columns from DB table
  email: str
  lastname: str
  firstname: str
  bucketfolder: str


class Asset:
  assetid: int  # these must match columns from DB table
  userid: int
  assetname: str
  bucketkey: str


class BucketItem:
  Key: str      # these must match columns from DB table
  LastModified: str
  ETag: str
  Size: int
  StorageClass: str


###################################################################
#
# prompt
#
def prompt():
  """
  Prompts the user and returns the command number
  
  Parameters
  ----------
  None
  
  Returns
  -------
  Command number entered by user (0, 1, 2, ...)
  """
  print()
  print(">> Enter a command:")
  print("   0 => end")
  print("   1 => stats")
  print("   2 => users")
  print("   3 => assets")
  print("   4 => download")
  print("   5 => download and display")
  print("   6 => bucket contents")

  cmd = int(input())
  return cmd


###################################################################
#
# stats
#
def stats(baseurl):
  """
  Prints out S3 and RDS info: bucket status, # of users and 
  assets in the database
  
  Parameters
  ----------
  baseurl: baseurl for web service
  
  Returns
  -------
  nothing
  """

  try:
    #
    # call the web service:
    #
    api = '/stats'
    url = baseurl + api

    res = requests.get(url)
    #
    # let's look at what we got back:
    #
    if res.status_code != 200:
      # failed:
      print("Failed with status code:", res.status_code)
      print("url: " + url)
      if res.status_code == 400:  # we'll have an error message
        body = res.json()
        print("Error message:", body["message"])
      #
      return

    #
    # deserialize and extract stats:
    #
    body = res.json()
    #
    print("bucket status:", body["message"])
    print("# of users:", body["db_numUsers"])
    print("# of assets:", body["db_numAssets"])

  except Exception as e:
    logging.error("stats() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return


###################################################################
#
# users
#
def users(baseurl):
  """
  Prints out all the users in the database
  
  Parameters
  ----------
  baseurl: baseurl for web service
  
  Returns
  -------
  nothing
  """

  try:
    #
    # call the web service:
    #
    api = '/users'
    url = baseurl + api

    res = requests.get(url)

    #
    # let's look at what we got back:
    #
    if res.status_code != 200:
      # failed:
      print("Failed with status code:", res.status_code)
      print("url: " + url)
      if res.status_code == 400:  # we'll have an error message
        body = res.json()
        print("Error message:", body["message"])
      #
      return

    #
    # deserialize and extract users:
    #
    body = res.json()
    #
    # let's map each dictionary into a User object:
    #
    users = []
    for row in body["data"]:
      user = jsons.load(row, User)
      users.append(user)
    #
    # Now we can think OOP:
    #
    for user in users:
      print(user.userid)
      print(" ", user.email)
      print(" ", user.lastname, ",", user.firstname)
      print(" ", user.bucketfolder)

  except Exception as e:
    logging.error("users() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return

###################################################################
#
# assets
#
def assets(baseurl):
  """
  Prints out all the assets in the database

  Parameters
  ----------
  baseurl: baseurl for web service

  Returns
  -------
  nothing
  """

  try:
    #
    # call the web service:
    #
    api = '/assets'
    url = baseurl + api

    res = requests.get(url)

    #
    # let's look at what we got back:
    #
    if res.status_code != 200:
      # failed:
      print("Failed with status code:", res.status_code)
      print("url: " + url)
      if res.status_code == 400:  # we'll have an error message
        body = res.json()
        print("Error message:", body["message"])
      #
      return

    #
    # deserialize and extract users:
    #
    body = res.json()
    #
    # let's map each dictionary into a Asset object:
    #
    assets = []
    for row in body["data"]:
      asset = jsons.load(row, Asset)
      assets.append(asset)
    #
    # Now we can think OOP:
    #
    for asset in assets:
      print(asset.assetid)
      print(" ", asset.userid)
      print(" ", asset.assetname)
      print(" ", asset.bucketkey)
    
  except Exception as e:
    logging.error("assets() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return

###################################################################
#
# download
#
def download(baseurl, display=False):
  """
  Prompts user to input asset id and then 
  looks up that asset in the database, downloads the file, 
  and renames it based on the original filename.

  If the asset id cannot be found, the following error message
  is outputted: "No such asset..."

  Option to display the image after downloading, not displayed
  by default.

  Parameters
  ----------
  baseurl: baseurl for web service
  display: controls whether image is displayed, false by default

  Returns
  -------
  nothing
  """

  try:

    # Prompts user to enter asset id.
    assetId = input("Enter asset id> \n")
    
    
    #
    # call the web service:
    #
    api = '/download/'
    url = baseurl + api + assetId

    res = requests.get(url)

    #
    # let's look at what we got back:
    #
    if res.status_code != 200:
      # failed:
      if res.status_code == 400:  # we'll have an error message
        # failed:
        print("Failed with status code:", res.status_code)
        print("url: " + url)
        if res.status_code == 400:  # we'll have an error message
          body = res.json()
          print("Error message:", body["message"])
        #
        return
      #
      return

    #
    # deserialize and extract necessary information:
    #
    body = res.json()

    asset_name = body["asset_name"]

    print("userid:", body["user_id"])
    print("asset name:", asset_name)
    print("bucket key:", body["bucket_key"])

    # Decode data from reponse.
    data = base64.b64decode(body["data"])
    # Create binary file with correct name.
    outfile = open(asset_name, "wb")
    # Write data to file.
    outfile.write(data)
    # Close file.
    outfile.close()
    print(f'Downloaded from S3 and saved as \' {asset_name} \'')

    # Display the image if the user chooses. 
    if display: 
      image = img.imread(asset_name)
      plt.imshow(image)
      plt.show()

    
  except Exception as e:
    logging.error("download() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return

###################################################################
#
# bucket
#
def bucket(baseurl):
  """
  Lists bucket contents one page at a time.

  Parameters
  ----------
  baseurl: baseurl for web service

  Returns
  -------
  nothing
  """

  try:

    lastBucket = ""
    
    # Infinite Loop 
    while(True):
      
      #
      # call the web service:
      #
      api = '/bucket?startafter='
      url = baseurl + api + lastBucket

      res = requests.get(url)
  
      # #
      # # let's look at what we got back:
      # #
      if res.status_code != 200:
        # failed:
        print("Failed with status code:", res.status_code)
        print("url: " + url)
        if res.status_code == 400:  # we'll have an error message
          body = res.json()
          print("Error message:", body["message"])
        #
        return
  
      # #
      # # deserialize and extract users:
      # #
      body = res.json()
      # If the web service returns 0 assets, do not prompt the user
      # for another page --- automatically break out of your paging loop.
      if (len(body["data"]) == 0):
        break
      # #
      # # let's map each dictionary into a Bucket object:
      # #
      buckets = []
      for row in body["data"]:
        bucket = jsons.load(row, BucketItem)
        buckets.append(bucket)
      # #
      # # Now we can think OOP:
      # #
      for bucket in buckets:
        print(bucket.Key)
        print(" ", bucket.LastModified)
        print(" ", bucket.Size)

      # Prompts user to continue to the next page. 
      nextPage = input("another page? [y/n] \n")
      if (nextPage.lower() == "y"):
        # Retrieve the last bucket of the 
        # current page to start next page.
        lastBucket = body["data"][-1]["Key"]
      else:
        break

  except Exception as e:
    logging.error("buckets() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return

########################################################################

#
# main
#
print('** Welcome to PhotoApp v2 **')
print()

# eliminate traceback so we just get error message:
sys.tracebacklimit = 0

#
# what config file should we use for this session?
#
config_file = 'photoapp-client-config.ini'

print("What config file to use for this session?")
print("Press ENTER to use default (photoapp-client-config.ini),")
print("otherwise enter name of config file>")
s = input()

if s == "":  # use default
  pass  # already set
else:
  config_file = s

#
# does config file exist?
#
if not pathlib.Path(config_file).is_file():
  print("**ERROR: config file '", config_file, "' does not exist, exiting")
  sys.exit(0)

#
# setup base URL to web service:
#
configur = ConfigParser()
configur.read(config_file)
baseurl = configur.get('client', 'webservice')

# print(baseurl)

#
# main processing loop:
#
cmd = prompt()

while cmd != 0:
  #
  if cmd == 1:
    stats(baseurl)
  elif cmd == 2:
    users(baseurl)
  elif cmd == 3:
    assets(baseurl)
  elif cmd == 4:
    download(baseurl)
  elif cmd == 5:
    download(baseurl, True)
  elif cmd == 6:
    bucket(baseurl)
  else:
    print("** Unknown command, try again...")
  #
  cmd = prompt()

#
# done
#
print()
print('** done **')
