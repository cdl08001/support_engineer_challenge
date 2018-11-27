import React, { Component } from 'react';
import './App.css';
import csv from 'csvtojson';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPhase: 'waiting for data'
    }
    this.updateView = this.updateView.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.studentData = null;
    this.coursesData = null;
    this.courseRequestData = null;
  }


  updateView() {
    if (this.state.currentPhase === 'waiting for data') {
      return (
        <form id="fileSelectionForm" onSubmit={this.handleSubmit}>
          <div id="studentInput" className="dataInputSelector">
            Students.csv:
            <input type="file" accept=".csv"/>
          </div>
          <div id="coursesInput" className="dataInputSelector">
            Courses.csv:
            <input type="file" accept=".csv"/>
          </div>
          <div id="courseRequestInput" className="dataInputSelector">
            Course_Requests.csv:
            <input type="file" accept=".csv"/>
          </div> 
          <button type="submit" id="fileSelectorBtn">Submit</button>
        </form>
      )
    }
  }

  handleSubmit(event) {
    event.preventDefault();
    const studentDataFile = event.target[0].files[0];
    const coursesDataFile = event.target[1].files[0];
    const courseRequestDataFile = event.target[2].files[0];
    const dataFiles = [studentDataFile, coursesDataFile, courseRequestDataFile]
    dataFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onerror = (event) => {
        console.log(event);
        reader.abort();
      }
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
            }
          })
      }
      reader.readAsText(dataFiles[index]);
    })
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
