# mobile-apps-server-code
Node.js code for server side stuff, user management and save game info

![Nebin](http://img3.wikia.nocookie.net/__cb20141012062444/dungeonsdragons/images/f/fe/Nebin.jpg "Nebins Tower")

Contents:
---------
1. About
2. How to Query the API
3. Tools & Environment used
4. Team
 

1 - About
---
This is the node.js server side code for ou mobile apps game project which we also intend to submit to the games fleadh in March 2016.

The aim of this code is to provide user management, session management and cloud save/load capabilities for our Unity game, the repositroy for which can be found [here](https://github.com/JohnMalmsteen/mobile-apps-tower-defense). The user should be able to create an account, login and save/load their characters from the game.

The API is designed be REST compliant but only serves and receives JSON, not XML.

2 - How to Query the API
---
The endpoints here are fairly self documenting as per the REST standard requirements, and only the GET and POST HTTP request verbs are used (lo-REST) to make it maximally compliant with the various XHTTP request implementations. However it should be noted that loading characters is done with a post so that the token you send over remains encrpyted with SSL.

### Routes
Route | HTTP Method | Description | Body | Return
---------|------------|------------|------------|------------
/ | GET | Basic API route (no functionality) | | {message: 'This is the Nebins Tower API'}
/register/ | POST | Route that allows for new user registration | {username: [username], password: [password]} | {token: token}
/user/:username | GET | Route that checks if a certain [:username] exists, used for the registration form | | {exists: boolean})
/login/ | POST | Route that logs the user in | {username: [username], password: password} | {token: token}
/saveCharacters/ | POST | Route for saving data to the database | {username: [username], token: [token], savedata: [savedata in json]} | {message: 'Save Successful'}
/loadCharacters/ | POST | Route for loading data from the database | {username: [username], token: [token]} | {savedataJSON}

3 - Tools and Environments used
---
As previously mentioned, this is a node.js server (the code for which is [here](https://github.com/JohnMalmsteen/mobile-apps-server-code/blob/master/userManagement.js) running on an Ubuntu Server 14.04 LTS on Azure, its address is https://nebinstower.cloudapp.net:5000/ for SSL traffic and http://nebinstower.cloudapp.net:5001/ for standard unencrypted HTTP traffic.

The npm dependencies can be seen in the [package.json](https://github.com/JohnMalmsteen/mobile-apps-server-code/blob/master/package.json) file.

We used MongoDB as our database and it runs on the same host and can't be accessed except through the node.js middleware or via ssh to the server. We selected MongoDB to allow flexibility of save data as we will likely massively change the datastructures used so a schemaless system was required.

Should you wish to run this code elsewhere you will need npm, nodejs and mongodb installed, you will also need an ssl certificate and key which can be placed in a "sslcert/" directory beside the userManagement.js file.

4 - Team
---
This project was created by Andrew Sweenet & John Frizzell,  
Software Development students in fourth year, term 1, GMIT  
for the Mobile Applications Development Module.

<a href="https://github.com/AndyDev2013"><img src="https://avatars2.githubusercontent.com/u/6676433?v=3&s=460" width="100px" height="100px" title="Andy" alt="Andy Image"/></a> <a href="https://github.com/JohnMalmsteen"><img src="https://avatars1.githubusercontent.com/u/7085486?v=3&s=400" width="100px" height="100px" title="John" alt="John Image"/></a>
