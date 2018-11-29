## Support_Engineer_Challenge
This application is intended to injest students, courses, and course request data and run an analysis to confirm that the following rules are being enforced:

 - Only students in grades 9 through 12 (for the upcoming 2019-2020 year) are enrolled.
 - Each student’s total course load for the year must offer a minimum of 12 credits and a maximum of 24 credits
 - Each student must have a History, English, Science, and Math course based on the course’s subject area
 - All students need an Advisory course (course code: 8027_2)
 - Only 11th and 12th graders can enroll in AP courses

## Motivation
In order to create a lightwieght and flexible application, I decided to leverage IndexedDB in order to eliminate the need for server and database setup. This will allow end-users the ability to run the application directly from their local machine without the need for advanced configuration or installation. 

## Code style
This application follows the Airbnb JavaScript Style Guide:

[![JavaScript Style Guide: Airbbnb](https://img.shields.io/badge/code%20style-airbnb-brightgreen.svg)](https://github.com/airbnb/javascript)
 
## Screenshots
Working

## Tech/framework used
<b>Built with</b>
- [ReactJS](https://reactjs.org/)
- [create-react-app](https://github.com/facebook/create-react-app)
- [indexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
- [csvtojson](https://www.npmjs.com/package/csvtojson)
- [file-saver](https://github.com/eligrey/FileSaver.js/)

## Features


## Code Example


## Installation
Step 1: fork\clone repo to local machine.
Step 2: run 'npm install' to install dependencies.
Step 3: run 'npm run start' to launch application. If your browser does not launch automatically, navigate to http://localhost:3000/ to get started (Google Chrome reccomended). 

## How to use?

**Step 1: File Upload**
Once the application has been launched, the first step is to select three **csv** files containing the below information. Please be mindful that the data is structured in the specified manner:
- Student Data:
  - student_id,grade_level,gender
- Courses Data:
  - course_code,course_name,subject_area,credits_offered,is_ap
- Course Requests Data 
  - student_id,course_code
  
*Note that the application will throw an error if the above structure is not followed*

Once the files have been selected, click "Submit"

**Step 2: Populate Database**
The next step is to populate the indexedDB database. Simply click "Populate Database" to accomplish this. The page will automatically redirect you to step 3, where you can then view the data within the 'application' tab of the chrome dev tools. 

**Step 3: Run Analysis**
The final step is to choose the analysis you want to run. The options are as follows: 

Students must be between grades 9 and 12
Students must be signed up for a mimumum of 12 and maximum of 24 credits
Students must have a History, English, Science, and Math course based on the course’s subject area
Students must be enrolled in an advisory course
Only students in grades 11 and 12 are eligible for AP courses:

Clicking the buttons next to these options will kick off asynchronous operations within the indexedDB database. The application does not currently show a progress status, however once complete text will be visible indicating the number of conflicts found for each operation. You will also then have the ability to save conflict reports once the corresponding operation has completed. 

## API Reference

Working

## Database Reference: 

Working

## Tests

Working
