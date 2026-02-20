// ----------------------- MAIN GITGRAPH ----------------------- //

var colors = [ "#6e7681", "#58a6ff", "#d29922", "#3fb950", "#f85149",
               "#bc8cff", "#58a6ff", "#d29922", "#3fb950", "#f85149",
               "#bc8cff", "#58a6ff", "#d29922", "#3fb950", "#f85149" ];

var current_color = 0;

// Custom template: thinner lines, smaller dots, wider spacing
var myTemplate = new GitGraph.Template({
  colors: colors,
  branch: {
    lineWidth: 3,
    spacingX: 55,
    labelRotation: 0
  },
  commit: {
    spacingY: -40,
    dot: {
      size: 6,
      strokeWidth: 2
    },
    message: {
      font: "bold 13px 'Inter', sans-serif",
      displayBranch: false,
      displayHash: false,
      displayAuthor: false
    },
    tag: {
      font: "bold 13px 'Inter', sans-serif"
    }
  }
});

var gitgraph = new GitGraph({
  template: myTemplate,
  author: "",
});

// Merge style: subtle but readable
var merge_font = "italic 11px 'Inter', sans-serif";
var merge_color = "#6e7681";

getColor = function() {
  var color = colors[current_color];
  current_color++;
  return color;
};

// Helper: dynamic publication count from Liquid-injected data
function _pc(typeKey) {
  var c = window.pubCounts && window.pubCounts[typeKey];
  return c ? " (" + c + ")" : "";
}

// ---- MAIN BRANCH ----
var branch_color = getColor();
var cv_eeha = gitgraph
  .branch({name: "eeha", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "", message: "About me: " , detailId: "detail-presentation"})
  .commit({tag: "", message: " " });

// ---- EDUCATION ----
branch_color = getColor();
var education = cv_eeha
  .branch({name: "education", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "Education", message: " " })
  .commit({message: "[2022 – Currently] PhD.Tecnologías Industriales y de Telecomunicación · UMH", detailId: "detail-phd" })
  .commit({message: "[2021 – 2022] M.Sc. Robotics · UMH", detailId: "detail-mscrobotics" })
  .commit({message: "[2012 – 2018] B.Sc. Electronics & Automation Eng. · UPM", detailId: "detail-electronicsdeg" })
  .merge(cv_eeha, {message: "merge education", messageFont: merge_font, messageColor: merge_color}).delete();

cv_eeha.checkout();

// ---- WORK EXPERIENCE ----
branch_color = getColor();
var work = cv_eeha
  .branch({name: "work", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "Work Experience", message: " "})
  .commit({message: "[Dec. 2022 – Currently] Research Engineer & PhD Student · UMH", detailId: "detail-umh" })
  .commit({message: "[Dec. 2025] Visiting researcher · DFKI Bremen", detailId: "detail-dfki-2025" })
  .commit({message: "[Feb. 2022 – Sep. 2022] Internship · UMH", detailId: "detail-umh-intern" })
  .commit({message: "[Feb. 2017 – Oct. 2021] Robotics Engineer · GMV · On Board Autonomy Division", detailId: "detail-gmv" })
  .commit({message: "[Feb. 2016 - Aug. 2016] Intern · BQ", detailId: "detail-bq" });
work.merge(cv_eeha, {message: "merge work experience", messageFont: merge_font, messageColor: merge_color}).delete();
cv_eeha.checkout();

// ---- PUBLICATIONS (with sub-commits per type) ----
branch_color = getColor();
var pub_color = branch_color;
var publications = cv_eeha
  .branch({name: "publications", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "Publications", message: " "}) //, detailId: "detail-publications" })
  .commit({message: "Journal Articles" + _pc("journal"), detailId: "detail-pub-journals" })
  .commit({message: "Book Chapters" + _pc("book_chapter"), detailId: "detail-pub-chapters" })
  .commit({message: "Conference Papers" + _pc("conference_paper"), detailId: "detail-pub-conferences" })
  .commit({message: "Oral Presentations" + _pc("presentation"), detailId: "detail-pub-presentations" })
  .commit({message: "Poster presentations" + _pc("poster"), detailId: "detail-pub-posters" })
  .merge(cv_eeha, {message: "merge publications", messageFont: merge_font, messageColor: merge_color}).delete();
cv_eeha.checkout();

// ---- PROJECTS ----
branch_color = getColor();
var projects = cv_eeha
  .branch({name: "projects", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "Projects", message: " ", detailId: "detail-projects" })
  .merge(cv_eeha, {message: "merge projects", messageFont: merge_font, messageColor: merge_color}).delete();
cv_eeha.checkout();


// ---- COURSES ----
branch_color = getColor();
var courses = cv_eeha
  .branch({name: "courses", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "Courses and Workshops", message: " ", detailId: "detail-courses" })
  .merge(cv_eeha, {message: "merge courses", messageFont: merge_font, messageColor: merge_color}).delete();

// ---- SKILLS ----
branch_color = getColor();
var skills = cv_eeha
  .branch({name: "skills", color: branch_color, commitDefaultOptions: {color: branch_color}})
  .commit({tag: "Skills", message: " ", detailId: "detail-skills" })
  .merge(cv_eeha, {message: "merge skills", messageFont: merge_font, messageColor: merge_color}).delete();

cv_eeha.commit({message: "Feel free to reach out! :)", messageColor: "#6e7681"});
