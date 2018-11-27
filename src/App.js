import React, { Component } from 'react';
import './App.css';
import csv from 'csvtojson';
import db from './db/database.js'

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPhase: 'waiting for data'
    }
    this.updateView = this.updateView.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.populateDatabase = this.populateDatabase.bind(this);
    this.studentData = null;
    this.coursesData = null;
    this.courseRequestData = null;
  }

  // Method that is called each time the App component is rendered
  // Adjusts html elements depending on currentPhase state
  updateView() {
    if (this.state.currentPhase === 'waiting for data') {
      return (
        <form id="fileSelectionForm" onSubmit={this.handleSubmit}>
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
        <form id="analysisInitiationForm" onSubmit={this.populateDatabase}>
          <button type="submit" id="startAnalysisBtn">Populate Database</button>
        </form>
      )
    }
  }

  // Reads the contents of selected CSV files on submit, converts
  // into CSV format, and saves as local class properties. 
  // Updates state on completion. 
  handleSubmit(event) {
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
  // button and display a notification message once clicked. 
  populateDatabase(event) {
    event.preventDefault();
    const message = document.createElement("div");
    message.innerText = 'Please wait while the system attempts to load the data. This page will automatically refresh once complete.';
    document.getElementById("analysisInitiationForm").appendChild(message);
    document.getElementById('startAnalysisBtn').setAttribute("disabled", "disabled");
    db.open(() => { 
      db.populateStores(this.studentData, this.coursesData, this.courseRequestData, (test) => {
        console.log(test)
      })
    });
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
