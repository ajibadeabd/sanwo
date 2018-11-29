# SETUP INSTRUCTION

- You must setup environment variable to run the app, to do that, create a new file `.env`  
  Copy the content of `.env_example` into `.env`. Please don't rename, copy instead.
  Edit the content to suit your needs

- run `npm install` in the terminal/command line to install all dependencies

- run `npm start` to start the app


## CODING INSTRUCTION

- Understanding the folder structure.
  `src`: All codes must be written inside this sub folder depending on the task as explained below
  `route`: Contains all your route. All route most be loaded from the `index.js` (child of index.js)
  `models`: Contain all the database schema/models
  `controller`: Contains functions that calls the route
  `functions`: Contain all the logic use by the controller.  

  NOTE: The `index.js` should only be use to load your route file as shown in the comment found inside the `index.js` file in the `route` directory. Create should create all your route inside the `route` folder loaded by the `index.js` file. 

  You can checkout the sample files inside the `route`, `models` and `controllers` folder.
  You are free to delete all the sample files.

- All database schema/models should be inside the models (`src/models`) folder and should be reference/imported into the index (`src/models/index.js`) file. see the sample file at `src/models/sampleModel.js`.
  For simplicity, all the Database Models imported into the `src/models/index.js` file has been attached to the req Object
  and can easily be accessed using `req.Models.DatabaseName` 
  e.g for the sample model created, you can do `req.Models.Sample.find({}, ()=>{ })`    

- We will be using Eslint (airbnb) to enforce code standard and styling.
  When trying to start the app using the npm start, eslint is trigger to check for code conformity to standard.

- Although the eslint tries to fix some errors found, you must manually fix any eslint error before the app will run 
  Or before pushing to server

- Create and Use different branch for working on different feature/task.

- Send PR (Pull Request) to the `develop` branch. 
  The EA (Enterprise Architechture) will review and approve or reject with reasons as the case may be.

- Branch Flow:
  `master`: Contain the clean working code.
  `develop`: New feature_branch must be created from this branch
  `feature_branch`: You must create a new branch when starting a new feature from the develop branch 
                    git branch develop
                    git checkout -b login_feature

- No adjustment should be made to the `app.js` in the root directory or any other files in the root directory. 
  All changes should be done inside the `src` sub folder.

- Environment variables should be entered into the .env file instead. 
  The environment variable set can be access in your node app using process.env.VARABLE_NAME
  Please dont rename the `.env_example` to `.env`, copy instead

- No console.log is allowed to avoid its abuse. If you want to log to the console, Please use `req.log` to log to console. 
  Using req.log allows us to simple turn off the logging by changing the environment value to false in the `.env` file (DEBUG=false)
  e.g  `req.log('Its working fine to this point')`

- Images should be save inside the `public/upload` folder
  You can also create sub-folders instead to avoid dumping too many images in just one folder which can later affect the app performance.
  for instance, you can decide to save all profile images inside another subfolder (profile) e.g `public/uploads/profile`

- Please endeavor to ask if you need further clarification.
