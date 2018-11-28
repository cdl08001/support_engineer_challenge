const studentCourseDatabase = (() => {

  // Object which will house connection\query methods and be exported to App.js
  const database = {};

  // Database name
  const dbName = "support_engineer_challenge"

  // Variable to house the database connection once connected
  let db = null;

  // Method to open a connection to the database
  database.open = (cb) => {

    // Attempt to open a new 'support_engineer_challenge' database (version 1)
    const request = window.indexedDB.open(dbName, 1);

    // If opening the database fails, throw an error
    request.onerror = function(event) {
      throw new Error('Error opening database: ', request.errorCode);
    };

    // This event is only implemented in recent browsers   
    request.onupgradeneeded = function(event) { 
      const db = event.target.result;

      // Create a new store to hold the students, courses, and course requirements data
      const studentsStore = db.createObjectStore("students", { keyPath: "student_id" });
      const coursesStore = db.createObjectStore("courses", { keyPath: "course_code" });
      const courseRequirementsStore = db.createObjectStore("courseRequirements", { autoIncrement: true });

      // Create indexes for each store. Assume there are duplicates
      studentsStore.createIndex("student_id", "student_id", { unique: false });      
      coursesStore.createIndex("course_code", "course_code", { unqiue: false });
      coursesStore.createIndex("course_name", "course_name", { unqiue: false });
      coursesStore.createIndex("subject_area", "subject_area", { unqiue: false });
      coursesStore.createIndex("credits_offered", "credits_offered", { unqiue: false });
      coursesStore.createIndex("is_ap", "is_ap", { unqiue: false });
      courseRequirementsStore.createIndex("student_id", "student_id", { unique: false });
      courseRequirementsStore.createIndex("course_code", "course_code", { unique: false });
    };

    // Will be triggered when onupgradeneeded exits succesfully, 
    // OR if onupgrade needed is not triggered but the database connects succesfully
    request.onsuccess = (event) => {
      db = event.target.result;

      // Clear the contents of each store prior to invoking callback
      const transaction = db.transaction(["students", "courses", "courseRequirements"], "readwrite");
      const studentsStore = transaction.objectStore("students");
      const studentsStoreRequest = studentsStore.clear();
      studentsStoreRequest.onsuccess = (event) => {
        const coursesStore = transaction.objectStore("courses");
        const coursesStoreRequest = coursesStore.clear();
        coursesStoreRequest.onsuccess = (event) => {
          const courseRequirementsStore = transaction.objectStore("courseRequirements");
          const courseRequirementsRequest = courseRequirementsStore.clear();
          courseRequirementsRequest.onsuccess = (event) => {
            cb();
          };
        };
      };
    };

  }

  database.populateStores = (studentData, coursesData, courseRequestsData, cb) => {
    const transaction = db.transaction(["students", "courses", "courseRequirements"], "readwrite");
    const studentsStore = transaction.objectStore("students");
    const coursesStore = transaction.objectStore("courses");
    const courseRequirementsStore = transaction.objectStore("courseRequirements")

    studentData.forEach((student, index) => {
      const request = studentsStore.add(student);
      request.onsuccess = (event) => {
        if (index === studentData.length - 1) {
          cb(null, 'students');
        }
      };
      request.onerror = () => {
        cb(request.error);
      }
    });

    coursesData.forEach((course, index) => {
      const request = coursesStore.add(course);
      request.onsuccess = (event) => {
        if (index === coursesData.length - 1) {
          cb(null, 'courses');
        }
      }
      request.onerror = () => {
        cb(request.error);
      }
    });

    courseRequestsData.forEach((courseRequest, index) => {
      const request = courseRequirementsStore.add(courseRequest);
      request.onsuccess = (event) => {
        if (index === courseRequestsData.length - 1) {
          cb(null, 'courseRequirements')
        }
      }
      request.onerror = () => {
        cb(request.error);
      }
    })

  }

  return database;

})()

module.exports = studentCourseDatabase;