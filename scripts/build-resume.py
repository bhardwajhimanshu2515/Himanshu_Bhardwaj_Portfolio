"""Build the text-based PDF and editable DOCX from the same verified content.
Run with Python packages reportlab, python-docx, and pypdf installed.
"""
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public"
NAME = "Himanshu-Bhardwaj-Resume-2026"
summary = "Senior Product Engineer with 5+ years of experience building full-stack web applications across utilities, healthcare, and HR technology. Strong expertise in React, TypeScript, Node.js, REST APIs, and enterprise .NET integrations. Delivered a 20% reduction in application load time, 30% improvement in development efficiency, and 25% fewer system crashes through performance optimization, reusable components, and production debugging."
skills = [
 ("Frontend", "React.js, Redux, Redux Toolkit, JavaScript, TypeScript, HTML, CSS, SCSS, Material UI, Ionic React"),
 ("Backend and APIs", "Node.js, Express.js, REST APIs, .NET integration, GraphQL, AWS AppSync"),
 ("Databases", "MongoDB, Mongoose, SQL, DynamoDB"),
 ("Testing and delivery", "Jest, Enzyme, Git, GitHub, CI/CD, Heroku, Netlify, Jira, Confluence, Scrum"),
]
roles = [
 ("Senior Product Engineer - Full Stack", "Smart Energy Water Pvt. Ltd.", "Jan 2025 - Present", "Alectra Builder", [
  "Engineer scalable full-stack applications using React.js, Node.js, and .NET integrations.",
  "Optimize frontend performance and component reusability; streamline MongoDB and SQL interactions to support maintainable applications.",
  "Resolve critical production issues and improve code quality through automated testing and collaboration with .NET backend teams."
 ]),
 ("Product Engineer - Full Stack", "Smart Energy Water Pvt. Ltd.", "Aug 2023 - Jan 2025", "American Water", [
  "Reduced application load time by 20% through frontend optimization in React-based applications integrated with enterprise .NET services.",
  "Built reusable UI components that improved development efficiency by 30%; managed application state using Redux.",
  "Reduced testing errors by 30% using Jest and Enzyme, and reduced system crashes by 25% by debugging critical React components and backend integrations.",
  "Integrated and debugged .NET REST APIs to ensure reliable data flow across scalable applications."
 ]),
 ("React.js Developer", "Global Healthcare & Billing Partners", "Mar 2022 - May 2023", "Claimocity", [
  "Built cross-platform healthcare billing applications for web, iOS, and Android using Ionic React and TypeScript.",
  "Developed Node.js REST APIs and optimized MongoDB queries, reducing API response time by 20%.",
  "Collaborated with a 10-member team to deliver healthcare billing solutions."
 ]),
 ("React.js Developer", "Talentroots", "Apr 2021 - Mar 2022", "Emplify", [
  "Led UI development for an HRMS product using React.js and Redux Toolkit.",
  "Built GraphQL APIs using AWS AppSync and integrated third-party services including Gusto and Slack.",
  "Developed a Slack application that improved engagement by 15%."
 ]),
 ("Platform Ops Intern", "XenonStack", "Feb 2021 - Apr 2021", "", [
  "Built proofs of concept using React.js, Node.js, GraphQL, and MongoDB while collaborating with 10+ engineers."
 ]),
 ("MERN Stack Developer Intern", "The Youth Project", "May 2020 - Feb 2021", "", [
  "Built full-stack applications using React.js, Node.js, and MongoDB; developed REST APIs and CI/CD pipelines.",
  "Improved deployment workflows using Heroku and Netlify."
 ]),
]
styles = getSampleStyleSheet()
for name, size, leading, after in [("Name",24,28,5),("Subtitle",11,15,7),("Contact",9,13,3),("Section",10,14,8),("Role",10.5,14,3),("Meta",9,13,5),("Copy",10,14,7),("BulletCopy",10,14,5)]:
 styles.add(ParagraphStyle(name, fontName="Helvetica-Bold" if name in ["Name","Section","Role"] else "Helvetica", fontSize=size, leading=leading, spaceAfter=after, textColor=HexColor("#182925"), alignment=TA_LEFT))
styles["Section"].spaceBefore = 12
styles["Section"].keepWithNext = True
styles["BulletCopy"].leftIndent = 10
styles["BulletCopy"].firstLineIndent = -8
doc = Document()
section = doc.sections[0]
section.top_margin = section.bottom_margin = Inches(.65)
section.left_margin = section.right_margin = Inches(.7)
section.page_width = Inches(8.27)
section.page_height = Inches(11.69)
normal = doc.styles["Normal"]
normal.font.name = "Arial"
normal.font.size = Pt(10)
normal.paragraph_format.space_after = Pt(5)
normal.paragraph_format.line_spacing = 1.06
story = []
def add(text, kind="Copy"):
 story.append(Paragraph(escape(text), styles[kind]))
 p = doc.add_paragraph(text)
 if kind in ["Name","Section","Role"]:
  p.runs[0].bold = True
  p.runs[0].font.size = Pt({"Name":24,"Section":11,"Role":10.5}[kind])
 if kind in ["Section","Role","Meta"]:
  p.paragraph_format.keep_with_next = True
 if kind == "Section":
  p.paragraph_format.space_before = Pt(10)
 if kind == "BulletCopy":
  p.paragraph_format.left_indent = Inches(.12)
  p.paragraph_format.first_line_indent = Inches(-.1)
 return p
add("HIMANSHU BHARDWAJ", "Name")
add("SENIOR PRODUCT ENGINEER | FULL-STACK DEVELOPMENT", "Subtitle")
add("Noida, India | +91 7014296319 | bhardwajhimanshu2515@gmail.com", "Contact")
add("linkedin.com/in/mern-full-stack-developer", "Contact")
add("github.com/bhardwajhimanshu2515", "Contact")
add("PROFESSIONAL SUMMARY", "Section")
add(summary)
add("TECHNICAL SKILLS", "Section")
for label, value in skills:
 add(label + ": " + value)
add("PROFESSIONAL EXPERIENCE", "Section")
for index, (title, company, date, product, bullets) in enumerate(roles):
 if index == 2:
  story.append(PageBreak())
  doc.add_page_break()
  add("PROFESSIONAL EXPERIENCE (CONTINUED)", "Section")
 add(title, "Role")
 add(company + " | " + date, "Meta")
 if product:
  add("Product: " + product, "Meta")
 for bullet in bullets:
  add("- " + bullet, "BulletCopy")
 story.append(Spacer(1, 4))
add("EDUCATION", "Section")
add("B.Tech in Computer Science", "Role")
add("Poornima University | Aug 2017 - Jun 2021")
pdf = OUT / (NAME + ".pdf")
SimpleDocTemplate(str(pdf), pagesize=A4, rightMargin=45, leftMargin=45, topMargin=35, bottomMargin=35, title="Himanshu Bhardwaj - Senior Product Engineer", author="Himanshu Bhardwaj").build(story)
doc.save(OUT / (NAME + ".docx"))
reader = PdfReader(pdf)
text = "\n".join(page.extract_text() for page in reader.pages)
assert len(reader.pages) == 2, f"Expected two pages, found {len(reader.pages)}"
for token in ["HIMANSHU BHARDWAJ","PROFESSIONAL SUMMARY","TECHNICAL SKILLS","Alectra Builder","American Water","Claimocity","Emplify","Poornima University","7014296319"]:
 assert token in text, f"Missing extracted text: {token}"
assert text.index("PROFESSIONAL SUMMARY") < text.index("TECHNICAL SKILLS") < text.index("PROFESSIONAL EXPERIENCE")
print(f"Verified: {len(reader.pages)} pages, {len(text.split())} extractable words, all roles and contact details present.")
print(pdf)
print(OUT / (NAME + ".docx"))
