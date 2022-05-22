Activity (iam-3-sign-up-and-log-in)
https://digitalskills.instructure.com/courses/4878/pages/activity-iam-3-sign-up-and-log-in?module_item_id=635910

# Activity: Sign Up & Log In
* Now that we've learned some of the techniques necessary to safely collect and store passwords, let's add them to the sign-up process for our REST-Rant project, then try to log a user in based on his or her password.
## Setup
* This activity builds on the previous activities in the 'Identity & Access Management' series.
* If you can, navigate to where you've cloned down rest-rant-monorepo in two terminals, and run npm start in both its front-end and back-end directories.
* If for any reason you cannot continue to build off of existing work, follow the steps in the "Quick Start Instructions" before continuing with this activity.
## 1) Adding a password_digest column
* Our first step in adding passwords to REST-Rant is to add a column to the users table to store the passwords we collect.
* To keep users' passwords secure, we're not going to store them in plaintext. First we will hash them using bcrypt.
* To keep the distinction between the plaintext passwords we receive and the hashed passwords we store clear, we'll name the column we add to the users table password_digest instead of password.
* How do we add columns to SQL tables using Sequelize?
* * Use a migration

* Let's use the sequelize-cli to create a migration.
* Run the following in an open terminal in the REST-Rant back-end directory:

~~~

npx sequelize-cli migration:generate --name add-user-password

~~~

* Has the password_digest column been added to the table at this point?
* * No

## Open the migration in your code editor and make the following edits to change the table schema:

~~~
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'password_digest', {
      type: Sequelize.DataTypes.STRING
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('users', 'password_digest')
  }
};
~~~

* Let's run the migration to actually update the table schema:

~~~

npx sequelize-cli db:migrate

~~~

* Now that the password_digest column has been added to the table, our last step (for this part) is to add it to our model, which will allow us to interact with the column in our API logic.

* Open models/user.js and add the following line near the end of the file:

~~~
  
User.init({
    userId: {
      type: DataTypes.SMALLINT,
      primaryKey: true,
      autoIncrement: true

    },
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: DataTypes.STRING,
    passwordDigest: DataTypes.STRING
},
  
~~~

## 2) Using bcrypt to hash user passwords

* Now that we have a column to store the user's password, we'll need to collect it in the sign-up form and then hash it in the controller.
* Open the frontend/src/users/SignUpForm.js file and add the following form input in the component's JSX:

~~~
  
<div className="row">
    <div className="col-sm-6 form-group">
        <label htmlFor="email">Email</label>
        <input
            type="email"
            required
            value={user.email}
            onChange={e => setUser({ ...user, email: e.target.value })}
            className="form-control"
            id="email"
            name="email"
        />
    </div>
    <div className="col-sm-6 form-group">
        <label htmlFor="password">Password</label>
        <input
            type="password"
            required
            value={user.password}
            onChange={e => setUser({ ...user, password: e.target.value })}
            className="form-control"
            id="password"
            name="password"
        />
    </div>
</div>  

~~~

* Looking at the code for the form, what do you expect the form to do when submitted?
* * Send the form data to the back end.

* What is the HTTP method of the request that is made when the SignUpForm is submitted?
* * POST

* What is the path of the request that is made when the 'SignUpForm' is submitted?
* * /users

* Which file in the 'back end' folder contains the route handler for this request?
* * controllers/users.js

* Open controllers/users.js and review the post('/') handler.
* It is the route handler that runs when our sign-up form is submitted, and so it is where we will want to hash the user's password before inserting it into our users table.
* Before we do, we'll need to install bcrypt, the npm module we will use to hash passwords.
* Run npm install bcrypt in a terminal in your back-end directory.

## Next, require bcrypt in your users controller and use it in the route handler to define the passwordDigest:

~~~

const router = require('express').Router()
const db = require("../models")
const bcrypt = require('bcrypt')

const { User } = db

router.post('/', async (req, res) => {
    let { password, ...rest } = req.body;
    const user = await User.create({ 
        ...rest, 
        passwordDigest: await bcrypt.hash(password, 10)
    })
    res.json(user)
})   

~~~

* In your browser, fill out and submit the sign-up form, then check your back-end terminal to see if the new user was successfully inserted.
* If you would like, you can run the following query using pgAdmin to see the new user and their hashed password digest:

~~~

SELECT * FROM users;

~~~

## 3) Creating an authentication controller

* Now that our users have secure passwords, we can handle the submission of our log-in form and check if the provided password matches what we saved when a user signed up.
* To keep our log-in logic separate from our users or places logic, let's create a new controller, an authentication controller, to handle log in:

~~~

const router = require('express').Router()
const db = require("../models")
const bcrypt = require('bcrypt')

const { User } = db

router.post('/', async (req, res) => {
    console.log('IN HERE')
})

module.exports = router

~~~

* Of course, this route handler isn't doing anything at the moment.
* We'll come back and add logic to it later, after we've tested that we can actually invoke this route handler from our log-in form.
* Note that we're going to require the User model.
* We aren't really using it at this point, but we know that in order to log a user in, we'll need to query them from the database.
* We'll go ahead and require the model now so that we don't have to worry about it later.
* Before we move to the front end, make sure you connect the authentication controller to our Express API in the index file:

~~~
  
app.use('/places', require('./controllers/places'))
app.use('/users', require('./controllers/users'))
app.use('/authentication', require('./controllers/authentication'))

// Listen for Connections
app.listen(process.env.PORT, () => {

~~~

## 4) Fetching for login

* Now that we have a route handler defined on our back end, let's write the fetch request that will trigger that route handler when our log-in form is submitted. 
* Open src/users/LoginForm.js and add the following logic to the 'handleSubmit' function:

~~~
  
async function handleSubmit(e) {
    e.preventDefault()
    const response = await fetch(`http://localhost:5000/authentication/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
    })

    const data = await response.json()

    console.log(data)
}
  
~~~~

* Here we're using the appropriate HTTP method and path to invoke the route handler we just created, and we're sending the username and password the user entered, so that our back end can use it to lookup.
* We're moving quickly through this step, but the logic of the fetch request should be familiar from courses 5 and 7.
* If you have questions about how you would know to write this fetch request on your own, please refer to the lessons on fetch in course 5.
* At this point, you should be able to submit the log-in form, and "IN HERE" should be printed in your back-end terminal.