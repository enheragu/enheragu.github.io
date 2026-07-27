// ----------------------- MAIN GITGRAPH ----------------------- //

var C = GitGraphCommon;
var myTemplate = C.createTemplate();

// Explicit branch colors (not a sequential cycler: inserting a section must
// not shift the colors of the ones after it). Projects keeps RED to match
// the /projects/ page; Awards is gold/amber.
var SECTION_COLORS = {
  main:         C.palette.gray,
  education:    C.palette.blue,
  work:         C.palette.amber,
  publications: C.palette.green,
  awards:       C.palette.amber,
  projects:     C.palette.red,
  courses:      C.palette.purple,
  skills:       C.palette.blue
};

var gitgraph = new GitGraph({
  template: myTemplate,
  author: "",
});

// Helper: dynamic publication count from Liquid-injected data
function _pc(typeKey) {
  var c = window.pubCounts && window.pubCounts[typeKey];
  return c ? " (" + c + ")" : "";
}

// ---- MAIN BRANCH ----
var branch_color = SECTION_COLORS.main;
var cv_eeha = gitgraph
  .branch({name: "eeha", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "", message: C.label("detail-presentation", "About me") + ": ", detailId: "detail-presentation"})
  .commit({tag: "", message: " " });

// ---- EDUCATION ----
branch_color = SECTION_COLORS.education;
var education = cv_eeha
  .branch({name: "education", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "Education", message: " " })
  .commit({message: C.label("detail-phd", "PhD in Industrial & Telecom Technologies"), detailId: "detail-phd" })
  .commit({message: C.label("detail-mscrobotics", "M.Sc. Robotics"), detailId: "detail-mscrobotics" })
  .commit({message: C.label("detail-electronicsdeg", "B.Sc. Electronics & Automation Eng."), detailId: "detail-electronicsdeg" })
  .merge(cv_eeha, {message: "merge education", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();

cv_eeha.checkout();

// ---- WORK EXPERIENCE ----
branch_color = SECTION_COLORS.work;
var work = cv_eeha
  .branch({name: "work", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "Work Experience", message: " "})
  .commit({message: C.label("detail-umh", "[Dec. 2022 – present] · Research Engineer & PhD Student · UMH"), detailId: "detail-umh" })
  .commit({message: C.label("detail-umh-lecturer", "[Mar. – Jun. 2026] · Lecturer · UMH"), detailId: "detail-umh-lecturer" })
  .commit({message: C.label("detail-dfki-2025", "[Dec. 2025 · May–Jul. 2026] · Visiting researcher · DFKI Bremen"), detailId: "detail-dfki-2025" })
  .commit({message: C.label("detail-umh-intern", "[Feb. 2022 – Sep. 2022] · Research Intern · UMH"), detailId: "detail-umh-intern" })
  .commit({message: C.label("detail-gmv", "[Feb. 2017 – Oct. 2021] · Robotics Engineer · GMV · On Board Autonomy Division"), detailId: "detail-gmv" })
  .commit({message: C.label("detail-bq", "[Feb. 2016 – Aug. 2016] · Intern · BQ"), detailId: "detail-bq" });
work.merge(cv_eeha, {message: "merge work experience", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();
cv_eeha.checkout();

// ---- PUBLICATIONS (with sub-commits per type) ----
branch_color = SECTION_COLORS.publications;
var publications = cv_eeha
  .branch({name: "publications", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "Publications", message: " "})
  .commit({message: C.label("detail-pub-journals", "Journal Articles") + _pc("journal"), detailId: "detail-pub-journals" })
  .commit({message: C.label("detail-pub-chapters", "Book Chapters") + _pc("book_chapter"), detailId: "detail-pub-chapters" })
  .commit({message: C.label("detail-pub-conferences", "Conference Papers") + _pc("conference_paper"), detailId: "detail-pub-conferences" })
  .commit({message: C.label("detail-pub-preprints", "Preprints") + _pc("preprint"), detailId: "detail-pub-preprints" })
  // Theses render inside the Education panels (see _data/cv_sections.yml note):
  // .commit({message: C.label("detail-pub-theses", "Theses") + _pc("thesis"), detailId: "detail-pub-theses" })
  .commit({message: C.label("detail-pub-presentations", "Oral Presentations") + _pc("presentation"), detailId: "detail-pub-presentations" })
  .commit({message: C.label("detail-pub-posters", "Poster Presentations") + _pc("poster"), detailId: "detail-pub-posters" })
  .commit({message: C.label("detail-pub-software", "Software Tools") + _pc("software"), detailId: "detail-pub-software" })
  .merge(cv_eeha, {message: "merge publications", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();
cv_eeha.checkout();

// ---- AWARDS ----
branch_color = SECTION_COLORS.awards;
var awards = cv_eeha
  .branch({name: "awards", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "Awards", message: " ", detailId: "detail-awards" })
  .merge(cv_eeha, {message: "merge awards", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();
cv_eeha.checkout();

// ---- PROJECTS ----
branch_color = SECTION_COLORS.projects;
var projects = cv_eeha
  .branch({name: "projects", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "Projects", message: " ", detailId: "detail-projects" })
  .merge(cv_eeha, {message: "merge projects", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();
cv_eeha.checkout();

// ---- COURSES ----
branch_color = SECTION_COLORS.courses;
var courses = cv_eeha
  .branch({name: "courses", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "Courses and Workshops", message: " ", detailId: "detail-courses" })
  .merge(cv_eeha, {message: "merge courses", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();

// ---- SKILLS ----
branch_color = SECTION_COLORS.skills;
var skills = cv_eeha
  .branch({name: "skills", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "Skills", message: " ", detailId: "detail-skills" })
  .merge(cv_eeha, {message: "merge skills", messageFont: C.mergeFont, messageColor: C.mergeColor}).delete();

// Closing commit — the contact invitation. The address is assembled from parts
// (no literal e-mail string in the source) and lives on the CANVAS, i.e. drawn
// as pixels, not DOM text, so scrapers can't read it; the header icon is the
// clickable / copy-to-clipboard version.
cv_eeha.commit({message: "Feel free to reach out! :)  ·  " + "e.heredia" + String.fromCharCode(64) + "umh.es", messageColor: C.palette.gray});

// ---- Finalize: widthExtension + relayout + resize hook ----
C.finalize(gitgraph, myTemplate);
