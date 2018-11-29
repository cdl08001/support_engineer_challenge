/* eslint-env browser */
/* eslint class-methods-use-this: ["error", { "exceptMethods": ["handleGradeCheck", "handleCreditCheck", "handleSubjectCheck", "handleAdvisoryCheck", "handleAPCheck", "convertJSONToCSV","saveReport"] }] */
import React, { Component } from 'react';
import './App.css';
import csv from 'csvtojson';
import FileSaver from 'file-saver';
import db from './db/database';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPhase: 'waiting for data',
    };
    this.updateView = this.updateView.bind(this);
    this.handleFileSelection = this.handleFileSelection.bind(this);
    this.populateDatabase = this.populateDatabase.bind(this);
    this.handleGradeCheck = this.handleGradeCheck.bind(this);
    this.handleCreditCheck = this.handleCreditCheck.bind(this);
    this.handleSubjectCheck = this.handleSubjectCheck.bind(this);
    this.handleAdvisoryCheck = this.handleAdvisoryCheck.bind(this);
    this.handleAPCheck = this.handleAPCheck.bind(this);
    this.saveReport = this.saveReport.bind(this);
    this.convertJSONToCSV = this.convertJSONToCSV.bind(this);
    this.studentData = null;
    this.coursesData = null;
    this.courseRequestData = null;
    this.apConflicts = null;
    this.advisoryConflicts = null;
    this.subjectConflicts = null;
    this.creditConflicts = null;
  }

  // Method that is called each time the App component is rendered
  // Adjusts html elements depending on currentPhase state
  updateView() {
    const { currentPhase } = this.state;
    if (currentPhase === 'waiting for data') {
      return (
        <form id="fileSelectionForm" onSubmit={this.handleFileSelection}>
          <div id="studentInput" className="dataInputSelector">
            Students.csv:
            <input type="file" accept=".csv" required />
          </div>
          <div id="coursesInput" className="dataInputSelector">
            Courses.csv:
            <input type="file" accept=".csv" required />
          </div>
          <div id="courseRequestInput" className="dataInputSelector">
            Course_Requests.csv:
            <input type="file" accept=".csv" required />
          </div>
          <button type="submit" id="fileSelectorBtn">Submit</button>
        </form>
      );
    }
    if (currentPhase === 'data upload complete') {
      return (
        <form id="populateDatabaseForm" onSubmit={this.populateDatabase}>
          <button type="submit" id="startAnalysisBtn">Populate Database</button>
        </form>
      );
    }
    if (currentPhase === 'database populated') {
      return (
        <div id="dataAnalysis">
          <div className="dataAnalysisSelector">
            <form id="gradeCheckForm" onSubmit={this.handleGradeCheck}>
              Students must be between grades 9 and 12:
              <button type="submit" id="gradeCheckBtn">Check Grade</button>
              <button id="gradeConflictSave" className="saveButtons" type="button" onClick={this.saveReport}>Save Grade Conflicts</button>
            </form>
          </div>
          <div className="dataAnalysisSelector">
            <form id="creditCheckForm" onSubmit={this.handleCreditCheck}>
              Students must be signed up for a mimumum of 12 and maximum of 24 credits:
              <button type="submit" id="creditCheckBtn">Check Credits</button>
              <button id="creditConflictSave" className="saveButtons" type="button" onClick={this.saveReport}>Save Credit Conflicts</button>
            </form>
          </div>
          <div className="dataAnalysisSelector">
            <form id="subjectCheckForm" onSubmit={this.handleSubjectCheck}>
              Students must have a History, English, Science, and Math course based on the course’s subject area:
              <button type="submit" id="subjectCheckBtn">Check Subjects</button>
              <button id="subjectConflictSave" className="saveButtons" type="button" onClick={this.saveReport}>Save Subject Conflicts</button>
            </form>
          </div>
          <div className="dataAnalysisSelector">
            <form id="advisoryCheckForm" onSubmit={this.handleAdvisoryCheck}>
              Students must be enrolled in an advisory course:
              <button type="submit" id="advisoryCheckBtn">Check Advisory</button>
              <button id="advisoryConflictSave" className="saveButtons" type="button" onClick={this.saveReport}>Save Advisory Conflicts</button>
            </form>
          </div>
          <div className="dataAnalysisSelector">
            <form id="apCheckForm" onSubmit={this.handleAPCheck}>
              Only students in grades 11 and 12 are eligible for AP courses:
              <button type="submit" id="apCheckBtn">Check AP</button>
              <button id="apConflictSave" className="saveButtons" type="button" onClick={this.saveReport}>Save AP Conflicts</button>
            </form>
          </div>
        </div>
      );
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
      reader.onload = (e) => {
        csv()
          .fromString(e.target.result)
          .then((data) => {
            if (index === 0) {
              this.studentData = data;
            } else if (index === 1) {
              this.coursesData = data;
            } else if (index === 2) {
              this.courseRequestData = data;
              this.setState({
                currentPhase: 'data upload complete',
              });
            }
          });
      };
      reader.readAsText(dataFiles[index]);
    });
  }

  // Open the database connection. Opening will clear the current local stores and
  // attempt to populate with the provided JSON data. Additioanlly, disable the submission
  // button and display a notification message once clicked. Continuously check for completion
  // or error once population is submitted.
  populateDatabase(event) {
    event.preventDefault();
    const message = document.createElement('div');
    message.innerText = 'Please wait while the system attempts to load the data. This page will automatically refresh once complete.';
    document.getElementById('populateDatabaseForm').appendChild(message);
    document.getElementById('startAnalysisBtn').setAttribute('diplay', 'block');

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
      });
      const checkForCompletion = () => {
        if (studentDataPopulated === true && coursesDataPopulated === true && courseRequestsDataPopulated === true) {
          this.setState({
            currentPhase: 'database populated',
          });
        } else {
          setTimeout(checkForCompletion, 1000);
        }
      };
      checkForCompletion();
    });
  }

  // Runs a check to see if all student grades are between 9 and 12. If not, an object containing the
  // problematic students is returned and reported in a new element.
  handleGradeCheck(event) {
    event.preventDefault();
    document.getElementById('gradeCheckBtn').setAttribute('disabled', 'disabled');
    db.checkGrades((err, problemGrades) => {
      if (err) {
        throw err;
      }
      this.gradeConflicts = problemGrades;
      const message = document.createElement('div');
      message.innerText = `There are ${problemGrades.length} students in with grade conflicts.`;
      document.getElementById('gradeConflictSave').style.display = 'inline';
      document.getElementById('gradeCheckForm').appendChild(message);
    });
  }

  // Runs a check to see which students do not have credit counts between 12 and 24
  // Routinely checks for updates made by async operations and will
  // load error information into new html element.
  handleCreditCheck(event) {
    event.preventDefault();
    document.getElementById('creditCheckBtn').setAttribute('disabled', 'disabled');
    const problemStudents = [];
    let counter = 0;

    const checkForUpdates = () => {
      if (problemStudents.length > counter) {
        counter = problemStudents.length;
        setTimeout(checkForUpdates, 10000);
      } else {
        this.creditConflicts = problemStudents;
        const message = document.createElement('div');
        message.innerText = `There are ${problemStudents.length} students with class credit conflicts.`;
        document.getElementById('creditConflictSave').style.display = 'inline';
        document.getElementById('creditCheckForm').appendChild(message);
      }
    };

    db.checkCredits((err, data) => {
      if (err) {
        throw err;
      }
      problemStudents.push(data);
      if (problemStudents.length === 1) {
        checkForUpdates();
      }
    });
  }

  handleSubjectCheck(event) {
    event.preventDefault();
    document.getElementById('subjectCheckBtn').setAttribute('disabled', 'disabled');
    const problemStudents = [];
    let counter = 0;

    const checkForUpdates = () => {
      if (problemStudents.length > counter) {
        counter = problemStudents.length;
        setTimeout(checkForUpdates, 10000);
      } else {
        this.subjectConflicts = problemStudents;
        const message = document.createElement('div');
        message.innerText = `There are ${problemStudents.length} students with course subject conflicts.`;
        document.getElementById('subjectConflictSave').style.display = 'inline';
        document.getElementById('subjectCheckForm').appendChild(message);
      }
    };

    db.checkCourses((err, data) => {
      if (err) {
        throw err;
      }
      problemStudents.push(data);
      if (problemStudents.length === 1) {
        checkForUpdates();
      }
    });
  }

  handleAdvisoryCheck(event) {
    event.preventDefault();
    document.getElementById('advisoryCheckBtn').setAttribute('disabled', 'disabled');
    const problemStudents = [];
    let counter = 0;

    const checkForUpdates = () => {
      if (problemStudents.length > counter) {
        counter = problemStudents.length;
        setTimeout(checkForUpdates, 10000);
      } else {
        this.advisoryConflicts = problemStudents;
        const message = document.createElement('div');
        message.innerText = `There are ${problemStudents.length} students with advisory course conflicts.`;
        document.getElementById('advisoryConflictSave').style.display = 'inline';
        document.getElementById('advisoryCheckForm').appendChild(message);
      }
    };

    db.checkAdvisoryStatus((err, data) => {
      if (err) {
        throw err;
      }
      problemStudents.push(data);
      if (problemStudents.length === 1) {
        checkForUpdates();
      }
    });
  }

  handleAPCheck(event) {
    event.preventDefault();
    document.getElementById('apCheckBtn').setAttribute('disabled', 'disabled');
    const problemStudents = [];
    let counter = 0;

    const checkForUpdates = () => {
      if (problemStudents.length > counter) {
        counter = problemStudents.length;
        setTimeout(checkForUpdates, 10000);
      } else {
        this.apConflicts = problemStudents;
        const message = document.createElement('div');
        message.innerText = `There are ${problemStudents.length} students with AP course conflicts.`;
        document.getElementById('apConflictSave').style.display = 'inline';
        document.getElementById('apCheckForm').appendChild(message);
      }
    };

    db.checkAP((err, data) => {
      if (err) {
        throw err;
      }
      problemStudents.push(data);
      if (problemStudents.length === 1) {
        checkForUpdates();
      }
    });
  }

  convertJSONToCSV(conflictObject) {
    const replacer = (key, value) => { return value === null ? '' : value; };
    const header = Object.keys(conflictObject[0]);
    let csvData = conflictObject.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
    csvData.unshift(header.join(','));
    csvData = csvData.join('\r\n');
    return csvData;
  }

  saveReport(event) {
    const save = (fileName, contents) => {
      const blob = new Blob([contents], { type: 'text/plain;charset=utf-8' });
      FileSaver.saveAs(blob, fileName);
    };

    event.preventDefault();
    const { id } = event.target;
    if (id === 'gradeConflictSave') {
      const csvData = this.convertJSONToCSV(this.gradeConflicts);
      save('gradeConflicts.csv', csvData);
    }
    if (id === 'creditConflictSave') {
      const csvData = this.convertJSONToCSV(this.creditConflicts);
      save('creditConflicts.csv', csvData);
    }
    if (id === 'subjectConflictSave') {
      const csvData = this.convertJSONToCSV(this.subjectConflicts);
      save('subjectConflicts.csv', csvData);
    }
    if (id === 'advisoryConflictSave') {
      const csvData = this.convertJSONToCSV(this.advisoryConflicts);
      save('advisoryConflicts.csv', csvData);
    }
    if (id === 'apConflictSave') {
      const csvData = this.convertJSONToCSV(this.apConflicts);
      save('apConflicts.csv', csvData);
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
