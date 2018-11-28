import React, { Component } from 'react';
import './App.css';
import csv from 'csvtojson';
import db from './db/database.js'

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPhase: 'waiting for data',
    }
    this.updateView = this.updateView.bind(this);
    this.handleFileSelection = this.handleFileSelection.bind(this);
    this.populateDatabase = this.populateDatabase.bind(this);
    this.handleGradeCheck = this.handleGradeCheck.bind(this);
    this.handleCreditCheck = this.handleCreditCheck.bind(this);
    this.studentData = null;
    this.coursesData = null;
    this.courseRequestData = null;
  }

  // Method that is called each time the App component is rendered
  // Adjusts html elements depending on currentPhase state
  updateView() {
    if (this.state.currentPhase === 'waiting for data') {
      return (
        <form id="fileSelectionForm" onSubmit={this.handleFileSelection}>
          <div id="studentInput" className="dataInputSelector">
            Students.csv:
            <input type="file" accept=".csv" required/>
          </div>
          <div id="coursesInput" className="dataInputSelector">
            Courses.csv:
            <input type="file" accept=".csv" required/>
          </div>
          <div id="courseRequestInput" className="dataInputSelector">
            Course_Requests.csv:
            <input type="file" accept=".csv" required/>
          </div> 
          <button type="submit" id="fileSelectorBtn">Submit</button>
        </form>
      )
    } else if (this.state.currentPhase === 'data upload complete') {
      return (
        <form id="populateDatabaseForm" onSubmit={this.populateDatabase}>
          <button type="submit" id="startAnalysisBtn">Populate Database</button>
        </form>
      )
    } else if (this.state.currentPhase === 'database populated') {
      return (
        <div id="dataAnalysis">
          <form id="gradeCheckForm" onSubmit={this.handleGradeCheck}>
            Students must be between grades 9 and 12:
            <button type="submit" id="gradeCheckBtn">Check Grade</button>
          </form>
          <form id="creditCheckForm" onSubmit={this.handleCreditCheck}>
            Students must be signed up for a mimumum of 12 and maximum of 24 credits:
            <button type="submit" id="creditCheckBtn">Check Credits</button>
          </form>
          <form id="subjectCheckForm">
            Students must have a History, English, Science, and Math course based on the course’s subject area:
            <button type="submit" id="subjectCheckBtn">Check Subjects</button>
          </form>
          <form id="advisoryCheckForm">
            Students must be enrolled in an advisory course:
            <button type="submit" id="advisoryCheckBtn">Check Advisory</button>
          </form>
          <form id="apCheckForm">
            Only students in grades 11 and 12 are eligible for AP courses: 
            <button type="submit" id="apCheckBtn">Check AP</button>
          </form>
        </div>
      )
    }
  }

  // Reads the contents of selected CSV files on submit, converts
  // into CSV format, and saves as local class properties. 
  // Updates state on completion. 
  handleFileSelection(event) {
    event.preventDefault();
    const studentDataFile = event.target[0].files[0];
    const coursesDataFile = event.target[1].files[0];
    const courseRequestDataFile = event.target[2].files[0];
    const dataFiles = [studentDataFile, coursesDataFile, courseRequestDataFile];

    dataFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        csv()
          .fromString(event.target.result)
          .then((data) => {
            if(index === 0) {
              this.studentData = data;
            } else if (index === 1) {
              this.coursesData = data;
            } else if (index === 2) {
              this.courseRequestData = data;
              this.setState({
                currentPhase: 'data upload complete'
              })
            }
          })
      }
      reader.readAsText(dataFiles[index]);
    })
  }

  // Open the database connection. Opening will clear the current local stores and
  // attempt to populate with the provided JSON data. Additioanlly, disable the submission 
  // button and display a notification message once clicked. Continuously check for completion
  // or error once population is submitted.
  populateDatabase(event) {
    event.preventDefault();
    const message = document.createElement("div");
    message.innerText = 'Please wait while the system attempts to load the data. This page will automatically refresh once complete.';
    document.getElementById("populateDatabaseForm").appendChild(message);
    document.getElementById('startAnalysisBtn').setAttribute("disabled", "disabled");

    db.open(() => { 
      let studentDataPopulated = false; 
      let coursesDataPopulated = false;
      let courseRequestsDataPopulated = false;
      db.populateStores(this.studentData, this.coursesData, this.courseRequestData, (err, data) => {
        if (err) {
          throw err;
        }
        if (data === 'students') {
          studentDataPopulated = true;
        } else if (data === 'courses') {
          coursesDataPopulated = true;
        } else if (data === 'courseRequests') {
          courseRequestsDataPopulated = true;
        }
      })
      const checkForCompletion = () => {
        if (studentDataPopulated === true && coursesDataPopulated === true && courseRequestsDataPopulated === true) {
          this.setState({
            currentPhase: 'database populated'
          })
        } else {
          setTimeout(checkForCompletion, 1000);
        }
      }
      checkForCompletion();
    });
  }
  
  // Runs a check to see if all student grades are between 9 and 12. If not, an object containing the 
  // problematic students is returned and reported in a new element. 
  handleGradeCheck(event) {
    event.preventDefault();
    document.getElementById('gradeCheckBtn').setAttribute("disabled", "disabled");
    db.checkGrades((err, problemGrades) => {
      if ( err ) {
        throw err
      }
      const message = document.createElement("div");
      message.innerText = `There are ${problemGrades.length} students in grades outside the 9 through 12 requirement.`
      document.getElementById("gradeCheckForm").appendChild(message);
    })
  }

  // Runs a check to see which students do not have credit counts between 12 and 24
  // Routinely checks for updates made by async operations and will
  // load error information into new html element. 
  handleCreditCheck(event) {
    event.preventDefault();
    document.getElementById('creditCheckBtn').setAttribute("disabled", "disabled");
    let problemStudents = [];
    let counter = 0;
    db.checkCredits((err, data) => {
      if ( err ) {
        throw err;
      }
      problemStudents.push(data);
      if (problemStudents.length === 1) {
        checkForUpdates();
      }
    })
    const checkForUpdates = () => {
      if ( problemStudents.length > counter ) {
        counter = problemStudents.length;
        setTimeout(checkForUpdates, 2000);
      } else {
        const message = document.createElement("div");
        message.innerText = `There are ${problemStudents.length} students with class credit issues.`
        document.getElementById("creditCheckForm").appendChild(message);       
      }   
    }
  }

  render() {
    return (
      <div id="rootContents">
        <div id="title">
          <header>Support Engineer Challenge</header>
        </div>
        <div id="body">
        {this.updateView()}
        </div>
      </div>
    );
  }
}

export default App;
