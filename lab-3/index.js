// ===============================
//   MOCK DB (LocalStorage)
// ===============================
let courses = JSON.parse(localStorage.getItem("courses")) || [];
let enrollments = JSON.parse(localStorage.getItem("enrollments")) || [];

// for edit mode
let editingCourseId = null;
let editingEnrollId = null;

// ===============================
//   UTILITIES
// ===============================
function saveDB() {
  localStorage.setItem("courses", JSON.stringify(courses));
  localStorage.setItem("enrollments", JSON.stringify(enrollments));
}

function toast(msg, type = "info") {
  const t = document.getElementById("toast");
  t.innerText = msg;

  if (type === "error") t.style.background = "#d11f1f";
  else if (type === "success") t.style.background = "#1c7c3b";
  else t.style.background = "#222";

  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

function generateId(arr) {
  return arr.length ? Math.max(...arr.map((x) => x.id)) + 1 : 1;
}

// ===============================
//   COURSE CRUD
// ===============================
function createOrUpdateCourse() {
  try {
    const title = document.getElementById("courseTitle").value.trim();
    const desc = document.getElementById("courseDesc").value.trim();

    // validation
    if (!title || title.length < 3) throw new Error("Course title must be at least 3 characters.");
    if (!desc || desc.length < 5) throw new Error("Course description must be at least 5 characters.");

    if (editingCourseId !== null && courses.some((c) => c.id === editingCourseId)) {
      const idx = courses.findIndex((c) => c.id === editingCourseId);

      courses[idx].title = title;
      courses[idx].desc = desc;

      toast("✅ Course updated successfully", "success");
      editingCourseId = null;
      document.getElementById("courseBtn").innerText = "Create Course";
    } else {
      const newCourse = {
        id: generateId(courses),
        title,
        desc,
        createdAt: new Date().toISOString(),
      };
      courses.push(newCourse);
      toast("✅ Course created successfully", "success");
    }

    saveDB();
    resetCourseForm();
    renderCourses();
    renderCourseDropdown();
  } catch (err) {
    toast("❌ " + err.message, "error");
  }
}

function renderCourses() {
  const list = document.getElementById("courseList");
  list.innerHTML = "";

  if (!courses.length) {
    list.innerHTML = `<p class="small">No courses created yet.</p>`;
    return;
  }

  courses.forEach((course) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div class="item-title">${course.title}</div>
      <div class="item-desc">${course.desc}</div>
      <div class="small">CourseID: ${course.id}</div>
      <div class="item-actions">
        <button class="btn-secondary" onclick="editCourse(${course.id})">Edit</button>
        <button class="btn-danger" onclick="deleteCourse(${course.id})">Delete</button>
      </div>
    `;
    list.appendChild(div);
  });
}

function editCourse(id) {
  try {
    const course = courses.find((c) => c.id === id);
    if (!course) throw new Error("Course not found!");

    document.getElementById("courseTitle").value = course.title;
    document.getElementById("courseDesc").value = course.desc;
    editingCourseId = id;

    document.getElementById("courseBtn").innerText = "Update Course";
    toast("✏️ Editing course ID " + id, "info");
  } catch (err) {
    toast("❌ " + err.message, "error");
  }
}

function deleteCourse(id) {
  try {
    const course = courses.find((c) => c.id === id);
    if (!course) throw new Error("Course not found!");

    // Consistency rule: don't delete course with enrollments
    const hasEnrollments = enrollments.some((e) => e.courseId === id);
    if (hasEnrollments) throw new Error("Cannot delete course: enrollments exist.");

    courses = courses.filter((c) => c.id !== id);

    saveDB();
    renderCourses();
    renderCourseDropdown();
    toast("🗑️ Course deleted", "success");
  } catch (err) {
    toast("❌ " + err.message, "error");
  }
}

function resetCourseForm() {
  document.getElementById("courseTitle").value = "";
  document.getElementById("courseDesc").value = "";
  editingCourseId = null;
  document.getElementById("courseBtn").innerText = "Create Course";
}

// ===============================
//   ENROLLMENT CRUD
// ===============================
function renderCourseDropdown() {
  const select = document.getElementById("enrollCourseSelect");
  select.innerHTML = "";

  if (!courses.length) {
    select.innerHTML = `<option value="">No courses available</option>`;
    return;
  }

  courses.forEach((course) => {
    const option = document.createElement("option");
    option.value = course.id;
    option.textContent = `${course.title} (ID: ${course.id})`;
    select.appendChild(option);
  });
}

function createOrUpdateEnrollment() {
  try {
    const courseId = Number.parseInt(document.getElementById("enrollCourseSelect").value);
    const name = document.getElementById("studentName").value.trim();
    const email = document.getElementById("studentEmail").value.trim();

    if (!courseId) throw new Error("Please select a course.");
    if (!name || name.length < 3) throw new Error("Student name must be at least 3 characters.");
    if (!email?.includes("@")) throw new Error("Enter a valid email address.");

    // Unique constraint simulation: email cannot enroll twice in same course
    const exists = enrollments.some(
      (e) => e.courseId === courseId && e.email === email && e.id !== editingEnrollId
    );
    if (exists) throw new Error("This student email already enrolled in this course.");

    if (editingEnrollId) {
      const idx = enrollments.findIndex((e) => e.id === editingEnrollId);
      if (idx === -1) throw new Error("Enrollment not found!");

      enrollments[idx].courseId = courseId;
      enrollments[idx].name = name;
      enrollments[idx].email = email;

      editingEnrollId = null;
      document.getElementById("enrollBtn").innerText = "Enroll Student";
      toast("✅ Enrollment updated", "success");
    } else {
      const newEnroll = {
        id: generateId(enrollments),
        courseId,
        name,
        email,
        createdAt: new Date().toISOString(),
      };
      enrollments.push(newEnroll);
      toast("✅ Student enrolled successfully", "success");
    }

    saveDB();
    resetEnrollForm();
    renderEnrollments();
  } catch (err) {
    toast("❌ " + err.message, "error");
  }
}

function renderEnrollments() {
  const list = document.getElementById("enrollList");
  list.innerHTML = "";

  if (!enrollments.length) {
    list.innerHTML = `<p class="small">No enrollments found.</p>`;
    return;
  }

  enrollments.forEach((enroll) => {
    const course = courses.find((c) => c.id === enroll.courseId);
    const courseName = course ? course.title : "Unknown Course";

    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div class="item-title">${enroll.name}</div>
      <div class="item-desc">${enroll.email}</div>
      <div class="small">Course: ${courseName} | CourseID: ${enroll.courseId}</div>
      <div class="item-actions">
        <button class="btn-secondary" onclick="editEnrollment(${enroll.id})">Edit</button>
        <button class="btn-danger" onclick="deleteEnrollment(${enroll.id})">Delete</button>
      </div>
    `;
    list.appendChild(div);
  });
}

function editEnrollment(id) {
  try {
    const enr = enrollments.find((e) => e.id === id);
    if (!enr) throw new Error("Enrollment not found!");

    document.getElementById("enrollCourseSelect").value = enr.courseId;
    document.getElementById("studentName").value = enr.name;
    document.getElementById("studentEmail").value = enr.email;

    editingEnrollId = id;
    document.getElementById("enrollBtn").innerText = "Update Enrollment";
    toast("✏️ Editing enrollment ID " + id, "info");
  } catch (err) {
    toast("❌ " + err.message, "error");
  }
}

function deleteEnrollment(id) {
  try {
    const enr = enrollments.find((e) => e.id === id);
    if (!enr) throw new Error("Enrollment not found!");

    enrollments = enrollments.filter((e) => e.id !== id);

    saveDB();
    renderEnrollments();
    toast("🗑️ Enrollment deleted", "success");
  } catch (err) {
    toast("❌ " + err.message, "error");
  }
}

function resetEnrollForm() {
  document.getElementById("studentName").value = "";
  document.getElementById("studentEmail").value = "";
  editingEnrollId = null;
  document.getElementById("enrollBtn").innerText = "Enroll Student";
}

// ===============================
// INIT
// ===============================
document.getElementById("courseBtn").addEventListener("click", createOrUpdateCourse);
document.getElementById("courseResetBtn").addEventListener("click", resetCourseForm);

document.getElementById("enrollBtn").addEventListener("click", createOrUpdateEnrollment);
document.getElementById("enrollResetBtn").addEventListener("click", resetEnrollForm);

function init() {
  renderCourses();
  renderCourseDropdown();
  renderEnrollments();
}
init();