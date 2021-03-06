const studentCourseDatabase = (() => {
  // Object which will house connection\query methods and be exported to App.js
  const database = {};

  // Database name
  const dbName = 'support_engineer_challenge';

  // Variable to house the database connection once connected
  let db = null;

  // Method to open a connection to the database
  database.open = (cb) => {
    // Attempt to open a new 'support_engineer_challenge' database (version 1)
    const request = indexedDB.open(dbName, 1);

    // If opening the database fails, throw an error
    request.onerror = (event) => {
      throw new Error('Error opening database: ', request.errorCode);
    };

    // This event is only implemented in recent browsers
    request.onupgradeneeded = (event) => {
      db = event.target.result;

      // Create a new store to hold the students, courses, and course requirements data
      const studentsStore = db.createObjectStore('students', { keyPath: 'student_id' });
      const coursesStore = db.createObjectStore('courses', { keyPath: 'course_code' });
      const courseRequestsStore = db.createObjectStore('courseRequests', { autoIncrement: true });

      // Create indexes for each store. Assume there are duplicates
      studentsStore.createIndex('student_id', 'student_id', { unique: false });
      coursesStore.createIndex('course_code', 'course_code', { unqiue: false });
      coursesStore.createIndex('course_name', 'course_name', { unqiue: false });
      coursesStore.createIndex('subject_area', 'subject_area', { unqiue: false });
      coursesStore.createIndex('credits_offered', 'credits_offered', { unqiue: false });
      coursesStore.createIndex('is_ap', 'is_ap', { unqiue: false });
      courseRequestsStore.createIndex('student_id', 'student_id', { unique: false });
      courseRequestsStore.createIndex('course_code', 'course_code', { unique: false });
    };

    // Will be triggered when onupgradeneeded exits succesfully,
    // OR if onupgrade needed is not triggered but the database connects succesfully
    request.onsuccess = (event) => {
      db = event.target.result;

      // Clear the contents of each store prior to invoking callback
      const transaction = db.transaction(['students', 'courses', 'courseRequests'], 'readwrite');
      const studentsStore = transaction.objectStore('students');
      const studentsStoreRequest = studentsStore.clear();
      studentsStoreRequest.onsuccess = (event) => {
        const coursesStore = transaction.objectStore('courses');
        const coursesStoreRequest = coursesStore.clear();
        coursesStoreRequest.onsuccess = (event) => {
          const courseRequestsStore = transaction.objectStore('courseRequests');
          const courseRequestsRequest = courseRequestsStore.clear();
          courseRequestsRequest.onsuccess = (event) => {
            cb();
          };
        };
      };
    };
  };

  // Populates database stores with students, courses, and courseRequestData.
  // Iterates over each JSON object and pushes each object into associated store. 
  database.populateStores = (studentData, coursesData, courseRequestsData, cb) => {
    const transaction = db.transaction(['students', 'courses', 'courseRequests'], 'readwrite');
    const studentsStore = transaction.objectStore('students');
    const coursesStore = transaction.objectStore('courses');
    const courseRequestsStore = transaction.objectStore('courseRequests');

    studentData.forEach((student, index) => {
      const request = studentsStore.add(student);
      request.onsuccess = (event) => {
        if (index === studentData.length - 1) {
          cb(null, 'students');
        }
      };
      request.onerror = () => {
        cb(request.error);
      };
    });

    coursesData.forEach((course, index) => {
      const request = coursesStore.add(course);
      request.onsuccess = (event) => {
        if (index === coursesData.length - 1) {
          cb(null, 'courses');
        }
      };
      request.onerror = () => {
        cb(request.error);
      };
    });

    courseRequestsData.forEach((courseRequest, index) => {
      const request = courseRequestsStore.add(courseRequest);
      request.onsuccess = (event) => {
        if (index === courseRequestsData.length - 1) {
          cb(null, 'courseRequests');
        }
      };
      request.onerror = () => {
        cb(request.error);
      };
    });
  };

  // Students Store Query: return all students (array) that do not follow grade requirements
  // Iterates over the 'students' data store and check for 
  // students with grades that are either missing, less than 9,
  // or greater than 12. Creates objects for each record that follows that criteria (conflict)
  // and sends it to callback
  database.checkGrades = (cb) => {
    const transaction = db.transaction(['students'], 'readonly');
    const studentsStore = transaction.objectStore('students');
    const getCursorRequest = studentsStore.openCursor();
    const problemGrades = [];

    getCursorRequest.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const grade = parseInt(cursor.value.grade_level, 10);
        if (grade < 9 || grade > 12 || grade === undefined || grade === '' || grade === null) {
          const issueStudent = {
            student_id: cursor.value.student_id,
            student_grade: cursor.value.grade_level,
            error: 'Student is outside of grade range of 9-12.',
          };
          problemGrades.push(issueStudent);
          cursor.continue();
        } else {
          cursor.continue();
        }
      } else {
        cb(null, problemGrades);
      }
    };

    getCursorRequest.onerror = () => {
      cb(getCursorRequest.error);
    };
  };

  // Courses Store Query: provided a course code (string), return the associated number of credits (integer)
  database.calculateCourseCredits = (courseCode, cb) => {
    const transaction = db.transaction(['courses'], 'readonly');
    const coursesStore = transaction.objectStore('courses');
    const courseCodeIndex = coursesStore.index('course_code');
    const courseCodeIndexRequest = courseCodeIndex.get(courseCode);

    courseCodeIndexRequest.onsuccess = (event) => {
      const credits = parseInt(courseCodeIndexRequest.result.credits_offered, 10);
      cb(null, credits);
    };

    courseCodeIndexRequest.onerror = () => {
      cb(courseCodeIndexRequest.error);
    };

  };

  // Course_Requests Store Query: provided with a students id (string), return all courses a student is enrolled for (array)
  database.getStudentCourses = (studentId, cb) => {
    const transaction = db.transaction(['courseRequests'], 'readonly');
    const courseRequestsStore = transaction.objectStore('courseRequests');
    const studentIdIndex = courseRequestsStore.index('student_id');
    const studentIdIndexRequest = studentIdIndex.getAll(studentId);

    studentIdIndexRequest.onsuccess = (event) => {
      const courseCodes = [];
      studentIdIndexRequest.result.forEach((result) => {
        courseCodes.push(result.course_code);
      });
      cb(null, courseCodes);
    };

    studentIdIndexRequest.onerror = () => {
      cb(studentIdIndexRequest.error);
    };
  };

  // Courses Store Query: Provided with a course list (array), return all associated subjects in uppercase (array)
  database.getCourseSubjects = (courseList, cb) => {
    const transaction = db.transaction(['courses'], 'readonly');
    const coursesStore = transaction.objectStore('courses');
    const courseCodeIndex = coursesStore.index('course_code');
    const subjectList = [];

    courseList.forEach((courseCode, index) => {
      const courseCodeIndexRequest = courseCodeIndex.get(courseCode);

      courseCodeIndexRequest.onsuccess = (event) => {
        subjectList.push(courseCodeIndexRequest.result.subject_area.toUpperCase());
        if (index === courseList.length - 1) {
          cb(null, subjectList);
        }
      };

      courseCodeIndexRequest.onerror = (event) => {
        cb(courseCodeIndexRequest.error);
      };
    });
  };

  // Courses Store query: Return the course codes for all courses with an IS_AP value of true (array)
  database.getAPCourses = (cb) => {
    const transaction = db.transaction(['courses'], 'readonly');
    const coursesStore = transaction.objectStore('courses');
    const isAPIndex = coursesStore.index('is_ap');
    const isAPIndexRequest = isAPIndex.getAll('TRUE');
    const apCourseList = [];
 
    isAPIndexRequest.onsuccess = (event) => {
      isAPIndexRequest.result.forEach((course) => {
        apCourseList.push(course.course_code);
      });
      cb(null, apCourseList);
    };

    isAPIndexRequest.error = () => {
      cb(isAPIndexRequest.error);
    };
  };

  // Students Store Query: iterate through all students and return those that have credit
  // conflicts (Outside of the 12-24 range)
  database.checkCredits = (cb) => {
    const transaction = db.transaction(['students'], 'readonly');
    const studentsStore = transaction.objectStore('students');
    const getCursorRequest = studentsStore.openCursor();

    getCursorRequest.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const studentId = cursor.value.student_id;
        // Get course list array corresponding to current student
        database.getStudentCourses(studentId, (err, courseCodes) => {
          if (err) {
            throw err;
          }
          // If the current student does not have any course requests, create student data,
          // and invoke callback
          if (courseCodes.length === 0) {
            const issueStudent = {
              student_Id: studentId,
              totalCredits: 'N/A',
              error: 'Student is not present within course requests file.',
            };
            cb(null, issueStudent);
          } else {
            // If the current student has made a course request, iterate over the students
            // course list in order to tally total number of course credits. If the total number
            // of credits fall outside the 12 to 24 range, create student data and invoke callback
            let totalCredits = 0;
            courseCodes.forEach((code, index) => {
              database.calculateCourseCredits(code, (err, creditCount) => {
                if (err) {
                  throw err;
                }
                totalCredits += creditCount;
                if (index === courseCodes.length - 1) {
                  if (totalCredits < 12 || totalCredits > 24) {
                    const issueStudent = {
                      student_Id: studentId,
                      totalCredits,
                      error: 'Credit Total Outside Range of 12 to 24.',
                    };
                    cb(null, issueStudent); 
                  }
                }
              });
            });
          }
        });
        cursor.continue();
      }
    };
    getCursorRequest.onerror = () => {
      cb(getCursorRequest.error);
    };
  };

  // Students Store Query: iterate through all students and return those that have
  // subject conflicts (missing History\English\Science\Math)
  database.checkCourses = (cb) => {
    const transaction = db.transaction(['students'], 'readonly');
    const studentsStore = transaction.objectStore('students');
    const getCursorRequest = studentsStore.openCursor();

    getCursorRequest.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const studentId = cursor.value.student_id;
        // Get course list array corresponding to current student
        database.getStudentCourses(studentId, (err, courseCodes) => {
          if (err) {
            throw err;
          }
          // If the current student does not have any course requests, create student data,
          // and invoke callback
          if (courseCodes.length === 0) {
            const issueStudent = {
              student_id: studentId,
              error: 'Student is not present within course requests file.',
              noHistory: true,
              noEnglish: true,
              noScience: true,
              noMath: true,
            };
            cb(null, issueStudent);
          } else {
            // If the student has made a course request, get all subjects for those 
            // courses and check to see if required subjects are present. If not, 
            // create student data and invoke callback.
            database.getCourseSubjects(courseCodes, (err, subjects) => {
              let missingCourse = false;
              const issueStudent = {
                student_id: studentId,
                error: 'Student is missing a required subject.',
                noHistory: false,
                noEnglish: false,
                noScience: false,
                noMath: false,
              };
              if (err) {
                throw err;
              }
              if (!subjects.some(subject => subject.includes('HISTORY'))) {
                missingCourse = true;
                issueStudent.noHistory = true;
              }
              if (!subjects.some(subject => subject.includes('ENGLISH'))) {
                missingCourse = true;
                issueStudent.noEnglish = true;
              }
              if (!subjects.some(subject => subject.includes('SCIENCE'))) {
                missingCourse = true;
                issueStudent.noScience = true;
              }
              if (!subjects.some(subject => subject.includes('MATH'))) {
                missingCourse = true;
                issueStudent.noMath = true;
              }
              if (missingCourse) {
                cb(null, issueStudent);
              }
            });
          }
        });
        cursor.continue();
      }
    };

    getCursorRequest.onerror = () => {
      cb(getCursorRequest.error);
    };
  };

   // Students Store Query: iterate through all students. For each student,
   // get a listing of courses and check to see if the required course ('8027_2') is 
   // present.
  database.checkAdvisoryStatus = (cb) => {
    const transaction = db.transaction(['students'], 'readonly');
    const studentsStore = transaction.objectStore('students');
    const getCursorRequest = studentsStore.openCursor();

    getCursorRequest.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const studentId = cursor.value.student_id;
        database.getStudentCourses(studentId, (err, courseCodes) => {
          if (err) {
            throw err;
          }
          if (courseCodes.length === 0) {
            const issueStudent = {
              student_id: studentId,
              error: 'Student is not present within course requests file.',
            };
            cb(null, issueStudent);
          } else if (!courseCodes.includes('8027_2')) {
            const issueStudent = {
              student_id: studentId,
              error: 'Student is missing the required 8027_2 advisory course.',
            };
            cb(null, issueStudent);
          }
        });
        cursor.continue();
      }
    };

    getCursorRequest.onerror = () => {
      cb(getCursorRequest.error);
    };
  };

  // Students Store Query: call getAPCourses to get a list of all AP courses.
  // Once complete, store results in variable and interate over all students. 
  // Iterate over each student to find those outside of the grade requirement.
  // For those that are outside, see if their course list intersects with the AP courses.
  // If so, create student data and invoke callback. 
  database.checkAP = (cb) => {
    database.getAPCourses((err, data) => {
      const transaction = db.transaction(['students'], 'readonly');
      const studentsStore = transaction.objectStore('students');
      const getCursorRequest = studentsStore.openCursor();
      if (err) {
        throw err;
      }
      const apCourseList = data;
      getCursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (parseInt(cursor.value.grade_level, 10) !== 11
            && parseInt(cursor.value.grade_level, 10) !== 12) {
            const studentId = cursor.value.student_id;
            database.getStudentCourses(studentId, (err, courseCodes) => {
              if (courseCodes.length === 0) {
                const issueStudent = {
                  student_id: studentId,
                  error: 'Student is not present within course requests file.',
                };
                cb(null, issueStudent);
              } else {
                const problemCourses = [];
                courseCodes.forEach((code, index) => {
                  if (apCourseList.includes(code)) {
                    problemCourses.push(code);
                  }
                  if ((index === courseCodes.length - 1) && (problemCourses.length !== 0)) {
                    const issueStudent = {
                      student_id: studentId,
                      error: 'Student is not in grade 11 or 12 and is enrolled in AP course',
                    };
                    cb(null, issueStudent);
                  }
                });
              }
            });
            cursor.continue();
          } else {
            cursor.continue();
          }
        }
      };
      getCursorRequest.onerror = (event) => {
        cb(getCursorRequest.error);
      };
    });
  };

  return database;

})();

module.exports = studentCourseDatabase;
