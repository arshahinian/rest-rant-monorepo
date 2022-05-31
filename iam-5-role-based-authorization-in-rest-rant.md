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