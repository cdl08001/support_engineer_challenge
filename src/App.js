import React, { Component } from 'react';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPhase: 'waiting for data'
    }
    this.updateView = this.updateView.bind(this);
  }


  updateView() {
    if (this.state.currentPhase === 'waiting for data') {
      return (
        <form id="fileSelectionForm">
          <div id="studentInput" className="dataInputSelector">
            Students.csv:
            <input type="file" />
          </div>
          <div id="coursesInput" className="dataInputSelector">
            Courses.csv:
            <input type="file" />
          </div>
          <div id="courseRequestInput" className="dataInputSelector">
            Course_Requirements.csv:
            <input type="file" />
          </div> 
          <button type="submit" id="fileSelectorBtn">Submit</button>
        </form>
      )
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
