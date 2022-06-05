* URL: https://digitalskills.instructure.com/courses/4878/pages/activity-iam-5-role-based-authorization-in-rest-rant?module_item_id=635921
* Activity (iam-5-role-based-authorization-in-rest-rant)
* SD09 Cybersecurity | Identity & Access Management
# Activity: Rest-Rant Administrator Account
* Now that we have an idea of how to build authorization that responds to different user roles, let's apply this technique to finish Rest Rant by only allowing administrators to manage the places that are being reviewed.
## Setup
* This activity builds on the previous activities in the 'Identity & Access Management' series.
* If you can, navigate to where you've cloned down rest-rant-monorepo in two terminals, and run npm start in both its front-end and back-end directories.
* If for any reason you cannot continue to build off of existing work, follow the steps in the "Quick Start Instructions" before continuing with this activity.
## 1) Make sure you are on the correct branch
* You may continue to work on this project from either the jwt-authentication or session-authentication branch; just make sure you work on the same branch that you used when implementing authorization earlier in the course.
## 2) Add a role column to the users table
* Where will we save the role each user has?
* * In the users table
* So let's add a role column to the users table using a migration.
* * Run the following command in an open terminal in your back-end directory:
* * * npx sequelize-cli migration:generate --name add-user-role.
* Next, add the following contents to the migration:

~~~

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'role', {
        type: Sequelize.DataTypes.ENUM,
        values: [
          'reviewer',
          'admin',
        ],
        defaultValue: 'reviewer'
      })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('users', 'role')
  }
};

~~~

* We're using the ENUM datatype so that our database can force every user to act as a "reviewer" or an "admin".
* * Has the role column been added to the table at this point?
* * * No

* Let's run the migration to actually update the table schema:
* * npx sequelize-cli db:migrate

* Now that the role column has been added to the table, our last step (for this part) is to add it to our model, which will allow us to interact with the column in our API logic.
* Open models/user.js and add the following line near the end of the file:

* models/user.js

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
    role: {
        type: DataTypes.ENUM,
        values: [
          'reviewer',
          'admin',
        ],
    },
    passwordDigest: DataTypes.STRING
},

~~~

## 3) Restrict user access for signing up as an admin
* We don't want users to be able to sign up as admins, even by sending hand-written fetch requests.
* In our users controller, let's establish that any new users are going to be reviewers:

* controllers/users.js
~~~

const router = require('express').Router()
const db = require("../models")
const bcrypt = require('bcrypt')

const { User } = db

router.post('/', async (req, res) => {
    let { password, ...rest } = req.body;
    const user = await User.create({ 
        ...rest, 
        role: 'reviewer',
        passwordDigest: await bcrypt.hash(password, 10)
    })
    res.json(user)
})   

~~~

* Now, even if someone sends a request to this route handler with role: 'admin' in the request body, our API logic will overwrite it and make sure that the user is created with the proper role and permissions.

4) Seed an admin
* Since it is not possible to create an admin account using our API, we'll need to create one for ourselves to use with a seed file.
* Run the following command in an open terminal in your back-end directory:
* * npx sequelize-cli seed:generate --name add-admin
* Then add the following contents to the seed file:

~~~

'use strict';
const bcrypt = require('bcrypt')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('users', [{
      first_name: 'YOUR FIRST NAME',
      last_name: 'YOUR LAST NAME',
      email: 'admin@example.com',
      role: 'admin',
      password_digest: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
      created_at: new Date(),
      updated_at: new Date()
    }])
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', {
      email: 'admin@example.com'
    })
  }
}

~~~

* Here, we're referencing another .env variable for the administrator's password.
* We use it so that if our codebase is ever made public, people reading our seed files won't be able to learn the password to sign into the admin account.

* We'll need to add that variable to our .env file:

* backend/.env

~~~

PORT=5000
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_DATABASE=rest_rant_auth
SESSION_SECRET=qiweuxhoiuehqmie
JWT_SECRET=qiweuxhoiuehqmie
ADMIN_PASSWORD=number_one_ranter

~~~

* Now run the seed file to insert the admin user into the users table:
* * npx db: seed --name 20210729194945-add-admin.js. <-- THIS IS WRONG
* * sequelize db:seed --seed 20220531193828-add-admin.js
* At this point, you should be able to log in as the admin user.
* If you are already logged into Rest Rant and haven't created a log-out button yet, you'll need to log yourself out manually.
* For session authentication:
* * Go to the "Application" tab in the chrome DevTools, click on "Cookies" in the left-hand navigation, and delete all of them. Refresh the page; you should be logged out now.
* Once you're logged out, you should be able to log in using the email admin@example.com and the password number_one_ranter.

## 5) Check the logged-in user's role when creating, editing, or deleting places

* Now that we can log in as an admin user, let's restrict some of the actions available to normal reviewers by adding the following if-checks to our route handlers in the places controller:

* * * controllers/places.js

~~~
 
const { Place, Comment, User } = db

router.post('/', async (req, res) => {
    if(req.currentUser?.role !== 'admin'){
        return res.status(403).json({ message: 'You are not allowed to add a place'})
    }

router.put('/:placeId', async (req, res) => {
    if(req.currentUser?.role !== 'admin'){
        return res.status(403).json({ message: 'You are not allowed to edit places'})
    }

router.delete('/:placeId', async (req, res) => {
    if(req.currentUser?.role !== 'admin'){
        return res.status(403).json({ message: 'You are not allowed to delete places'})
    }
 
~~~

## 6) Hide admin buttons from non-admins

* Just like the authorization we implemented in our last activity, adding if-checks in our controllers is important to protect the API and database from all unauthorized requests, including hand-written fetch requests.
* However, it will leave broken buttons in our React app, making for a confusing user interface.
* Let's only show the Add Place button in the navigation menu if the logged-in user is an admin:
* * * src/Navigation.js
~~~  

if (currentUser) {
    loginActions = (
        <li style={{ float: 'right' }}>
            Logged in as {currentUser.firstName} {currentUser.lastName}
        </li>
    )
}

let addPlaceButton = null

if (currentUser?.role === 'admin') {
    addPlaceButton = (
        <li>
            <a href="#" onClick={() => history.push("/places/new")}>
                Add Place
            </a>
        </li>
    )
}

return (
    <nav>
          
            {addPlaceButton}
            {loginActions}
        </ul>
    </nav>

~~~

* Next, let's only show the Edit and Delete buttons on the place details page if the logged-in user is an admin:
* * * src/places/PlaceDetails.js
~~~

  
    comments = place.comments.map(comment => {
        return (
            <CommentCard 
                key={comment.commentId} 
                comment={comment} 
                onDelete={() => deleteComment(comment)} 
            />
        )
    })
}

let placeActions = null

if (currentUser?.role === 'admin') {
    placeActions = (
        <>
            <a className="btn btn-warning" onClick={editPlace}>
                Edit
            </a>
            <button type="submit" className="btn btn-danger" onClick={deletePlace}>
                Delete
            </button>
        </>
    )
}

return (
    <main>
        <div className="row">
              
                    Serving {place.cuisines}.
                </h4>
                <br />
                {placeActions}
            </div>
        </div>

~~~

## Reflect
* You've now built a secured application with Rest Rant!
* A few pieces of advice to keep in mind as you take these lessons with you into your programming career:
* Authentication and authorization are complex problems.
* If you are tasked with implementing it single-handedly as a junior developer, find another place to work.
* Good auth requires a team and experience to succeed.
* When securing your own applications, think like the attacker.
* There will always be new types of attacks to consider, so research common attack patterns often.
* At the very least, be proactive in guarding against Cross-Site Request Forgery and Cross-Site Scripting.
* Just because you can't break your application using your user interface, it doesn't mean your application is secure.
* Attackers don't have to go through your front end, they can write any arbitrary HTTP request and send it to your API directly.
* Make sure that any necessary authorization is handled at the controller level, not just in your React app or view layer.

## Acceptance Criteria
* When using admin credentials, expect to be able to successfully log in.
* When logged in as an admin, you should be able to see Edit and Delete buttons.
* When not logged in an as an admin, you should not be able to see Edit and Delete buttons.
* Before submitting, make sure you do a self review of your code.
* Check formatting and spelling, include comments in your code, and ensure you have a healthy commit history.

* Make sure to submit your github repository link on the submission page.