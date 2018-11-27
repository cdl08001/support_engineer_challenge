import React, { Component } from 'react';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPhase: 'waiting for data'
    }
    this.updateView = this.updateView.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.studentDataFile = null;
    this.coursesDataFile = null;
    this.courseRequestDataFile = null;
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
    this.studentDataFile = event.target[0].files[0].path;
    this.coursesDataFile = event.target[1].files[0].path;
    this.courseRequestDataFile = event.target[2].files[0].path;
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
