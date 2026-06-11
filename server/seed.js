import bcrypt from 'bcryptjs';
import db from './db.js';

const MENTOR_PASSWORD = bcrypt.hashSync('Equity@2026', 10);
const SCHOLAR_PASSWORD = bcrypt.hashSync('Cohort@2026', 10);
const ADMIN_PASSWORD = bcrypt.hashSync('Equity@2026', 10);

const admins = [
  { email: 'eccpmentor.regismukiza@gmail.com', name: 'Mukiza Jean Francois Regis', role: 'admin' },
  { email: 'mbabazi.sylvia@equitybank.co.rw', name: 'Mbabazi Sylvia', role: 'admin' },
  { email: 'JUDITH.MUTESI@equitybank.co.rw', name: 'Judith Mutesi', role: 'admin' },
];

const mentors = [
  { email: 'carineniyigena13@gmail.com', name: 'Carine Niyigena' },
  { email: 'gaelimena675@gmail.com', name: 'Gael Imena' },
  { email: 'lemily717@gmail.com', name: 'Mureramanzi Emilienne' },
  { email: 'mukizaregis26@gmail.com', name: 'Mukiza Jean Francois Regis' },
  { email: 'endamage416@gmail.com', name: 'Eric Shema Ndamage' },
  { email: 'tony.mwambalic@gmail.com', name: 'Tony Mwambali Cirhulwire' },
];

const mentees = [
  { pf: '56647', name: 'Mutimukeye Carine', gender: 'F', email: 'mutimukeyecarine91@gmail.com', mentor: 'Carine Niyigena' },
  { pf: '56648', name: 'Uwubahase Shimwa Odile', gender: 'F', email: 'uwubahaseshimwaodile@gmail.com', mentor: 'Gael Imena' },
  { pf: '56649', name: 'Mugisha Plamedi', gender: 'M', email: 'mugishaplamedi2@gmail.com', mentor: 'Mureramanzi Emilienne' },
  { pf: '56650', name: 'Ufitinema Obed', gender: 'M', email: 'ufitinemaobed8@gmail.com', mentor: 'Mukiza Jean Francois Regis' },
  { pf: '56651', name: 'Karara Ngabo Ange Servi Claudien', gender: 'M', email: 'kngaboasclaudien@gmail.com', mentor: 'Eric Shema Ndamage' },
  { pf: '56653', name: 'Bigirimana Ange Happiness', gender: 'F', email: 'happiness.ange7@gmail.com', mentor: 'Mureramanzi Emilienne' },
  { pf: '56654', name: 'Ndagijimana David', gender: 'M', email: 'ndagijimanad18@gmail.com', mentor: 'Gael Imena' },
  { pf: '56661', name: 'Kwizera Jean Bosco', gender: 'M', email: 'freeboymaestro4@gmail.com', mentor: 'Mureramanzi Emilienne' },
  { pf: '56662', name: 'Uwonkunda Henriette', gender: 'F', email: 'Uwonkundahenriette774@gmail.com', mentor: 'Carine Niyigena' },
  { pf: '56663', name: 'Ishimwe Sam Jakin', gender: 'M', email: 'sjishimwe@gmail.com', mentor: 'Mukiza Jean Francois Regis' },
  { pf: '56666', name: 'Tuyishime Grace', gender: 'F', email: 'tuyishimiregrace03@gmail.com', mentor: 'Gael Imena' },
  { pf: '56669', name: 'Shema Christian', gender: 'M', email: 'christianshema227@gmail.com', mentor: 'Mureramanzi Emilienne' },
  { pf: '56670', name: 'Ineza Mutabazi Hope', gender: 'F', email: 'inezamutabazih41@gmail.com', mentor: 'Tony Mwambali Cirhulwire' },
  { pf: '56671', name: 'Umuhoza Nshuti Josiane', gender: 'F', email: 'umuhozaj948@gmail.com', mentor: 'Gael Imena' },
  { pf: '56672', name: 'Bimenyimana Ryiza Naome', gender: 'F', email: 'b.ryizanaome@gmail.com', mentor: 'Mukiza Jean Francois Regis' },
  { pf: '56673', name: 'Niyogisubizo David', gender: 'M', email: 'dvdniyogisubizo@gmail.com', mentor: 'Mureramanzi Emilienne' },
  { pf: '56674', name: 'Iradukunda Livin', gender: 'M', email: 'ilivin497@gmail.com', mentor: 'Gael Imena' },
  { pf: '56675', name: 'Iyakaremye Dewel', gender: 'M', email: 'iyakaremyedewer2@gmail.com', mentor: 'Mureramanzi Emilienne' },
  { pf: '56676', name: 'Tuyishime Benitha', gender: 'F', email: 'benithatuyishime7@gmail.com', mentor: 'Eric Shema Ndamage' },
  { pf: '56677', name: 'Girwa Lucky Time', gender: 'M', email: 'girwaluckytime0@gmail.com', mentor: 'Mukiza Jean Francois Regis' },
  { pf: '56678', name: 'Ndahimana Hirwa Alain', gender: 'M', email: 'ndahimanahirwaalain@gmail.com', mentor: 'Tony Mwambali Cirhulwire' },
  { pf: '56679', name: 'Irimaso Camarade', gender: 'M', email: 'camarade010@gmail.com', mentor: 'Eric Shema Ndamage' },
  { pf: '56680', name: 'Inkindi Agahozo Peter Paola', gender: 'M', email: 'peterinkindiagahozo@gmail.com', mentor: 'Eric Shema Ndamage' },
  { pf: '56681', name: 'Niyobugingo Aimable', gender: 'M', email: 'holyangel144000@gmail.com', mentor: 'Carine Niyigena' },
  { pf: '56682', name: 'Uwisanze Pamela', gender: 'F', email: 'pamelauwisanze8@gmail.com', mentor: 'Gael Imena' },
  { pf: '56683', name: 'Mutoni Amie Ronia', gender: 'F', email: 'amieronia@gmail.com', mentor: 'Mureramanzi Emilienne' },
  { pf: '56684', name: 'Niyisubiza Aime Innocente', gender: 'F', email: 'aimeaudrey20@gmail.com', mentor: 'Carine Niyigena' },
  { pf: '56685', name: 'Cirhulwire Patricia', gender: 'F', email: 'paticirhu@gmail.com', mentor: 'Eric Shema Ndamage' },
  { pf: '56686', name: 'Tuyizere Isaac', gender: 'M', email: 'isaactuyizere520@gmail.com', mentor: 'Eric Shema Ndamage' },
  { pf: '56687', name: 'Ikuzwe Gihozo Emelyne', gender: 'F', email: 'emelyneigihozo07@gmail.com', mentor: 'Tony Mwambali Cirhulwire' },
  { pf: '56687B', name: 'Nkundimana Marie Emelyne', gender: 'F', email: 'mariemelyne11@gmail.com', mentor: 'Tony Mwambali Cirhulwire' },
  { pf: '56688', name: 'Kabogora Ketsia', gender: 'F', email: 'ketsiakabogora@gmail.com', mentor: 'Gael Imena' },
  { pf: '56689', name: 'Divine Irakoze', gender: 'F', email: 'divineirakoze860@gmail.com', mentor: 'Mukiza Jean Francois Regis' },
  { pf: '56690', name: 'Mukashema Alice', gender: 'F', email: 'mkshmlc@gmail.com', mentor: 'Tony Mwambali Cirhulwire' },
  { pf: '56691', name: 'Bugirimfura Charles', gender: 'M', email: 'charlesbugirimfura6@gmail.com', mentor: 'Carine Niyigena' },
  { pf: '56692', name: 'Kwizera Thierry', gender: 'M', email: 'thierrykwizera2008@gmail.com', mentor: 'Tony Mwambali Cirhulwire' },
  { pf: '56693', name: 'Mucyowera Agripine', gender: 'F', email: 'mucyowera18@gmail.com', mentor: 'Mukiza Jean Francois Regis' },
  { pf: '56694', name: 'Nizeyimana David', gender: 'M', email: 'nizeyimanadavid90@gmail.com', mentor: 'Gael Imena' },
  { pf: '56695', name: 'Iradukunda Elyse', gender: 'F', email: 'ielyse119@gmail.com', mentor: 'Gael Imena' },
  { pf: '56696', name: 'Tuyishime Hubert', gender: 'M', email: 'huberttuyishime85@gmail.com', mentor: 'Tony Mwambali Cirhulwire' },
  { pf: '56697', name: 'Ishimwe William', gender: 'M', email: 'ishwilliam006@gmail.com', mentor: 'Tony Mwambali Cirhulwire' },
  { pf: '56701', name: 'Ishimwe Jean Felis', gender: 'M', email: 'jeanfelisishimwe@gmail.com', mentor: 'Mukiza Jean Francois Regis' },
  { pf: '56702', name: 'Umutoni Merveille', gender: 'F', email: 'umutonimerveille24@gmail.com', mentor: 'Carine Niyigena' },
  { pf: '56703', name: 'Iyaduhuje Teta Emelyne', gender: 'F', email: 'iyaduhujetetae@gmail.com', mentor: 'Gael Imena' },
  { pf: '56704', name: 'Bizimana Aimee', gender: 'F', email: 'aimebizimana48@gmail.com', mentor: 'Mureramanzi Emilienne' },
  { pf: '56710', name: 'Umutoniwase Yvette', gender: 'F', email: 'umutoniwaseyvette733@gmail.com', mentor: 'Tony Mwambali Cirhulwire' },
  { pf: '56712', name: 'Ndayishimiye Benjamin', gender: 'M', email: 'benjaminndayishimiye9@gmail.com', mentor: 'Gael Imena' },
  { pf: '56713', name: 'Mutimucyeye Diane', gender: 'F', email: 'dianemutimucyeye036@gmail.com', mentor: 'Carine Niyigena' },
  { pf: '56719', name: 'Niyomwungeri Sandrine', gender: 'F', email: 'sniyomwungeri2000@gmail.com', mentor: 'Carine Niyigena' },
  { pf: '56720', name: 'Manzi Igor', gender: 'M', email: 'manziigor8@gmail.com', mentor: 'Mukiza Jean Francois Regis' },
  { pf: '56721', name: 'Impuhwezayo Ange Chanelle', gender: 'F', email: 'iangechanelle@gmail.com', mentor: 'Mureramanzi Emilienne' },
  { pf: '56722', name: 'Rutayisire Queen Bella', gender: 'F', email: 'rutayisirequeenbella@gmail.com', mentor: 'Carine Niyigena' },
  { pf: '56724', name: 'Niyonkuru Olivier', gender: 'M', email: 'oniyonkuru123@gmail.com', mentor: 'Mureramanzi Emilienne' },
  { pf: '56726', name: 'Kabuto Aime Amani', gender: 'M', email: 'kabutoa093@gmail.com', mentor: 'Mukiza Jean Francois Regis' },
  { pf: '56728', name: 'Mugisha Cedrick', gender: 'M', email: 'mugishacedrick929@gmail.com', mentor: 'Eric Shema Ndamage' },
  { pf: '56730', name: 'Nishimwe Angela', gender: 'F', email: 'nishimweangella83@gmail.com', mentor: 'Eric Shema Ndamage' },
  { pf: '56731', name: 'Irakoze Ingabire Aphia', gender: 'F', email: 'irakozeaphia@gmail.com', mentor: 'Eric Shema Ndamage' },
  { pf: '56732', name: 'Ujeneza Espoire', gender: 'M', email: 'ujenezaespoiree@gmail.com', mentor: 'Eric Shema Ndamage' },
  { pf: '56734', name: 'Habimana Hirwa Arnaud', gender: 'M', email: 'hirwarnaud12@gmail.com', mentor: 'Mukiza Jean Francois Regis' },
  { pf: '56735', name: 'Itangishaka Faustin', gender: 'M', email: 'itangishakafaustin1@gmail.com', mentor: 'Tony Mwambali Cirhulwire' },
  { pf: '56736', name: 'Irakoze Liza Grace Eunice', gender: 'F', email: 'irakozeliza734@gmail.com', mentor: 'Tony Mwambali Cirhulwire' },
  { pf: '56737', name: 'Bimenyimana Ezechiel', gender: 'M', email: 'ezechielbimenyimana2@gmail.com', mentor: 'Carine Niyigena' },
  { pf: '56738', name: 'Niyoniringiye Tharcille', gender: 'F', email: 'niyoniringiyethacille@gmail.com', mentor: 'Mureramanzi Emilienne' },
  { pf: '56740', name: 'Eza Alain', gender: 'M', email: 'ealain2345@gmail.com', mentor: 'Carine Niyigena' },
  { pf: '56741', name: 'Nizeyimana Fils', gender: 'M', email: 'nizeyimanafils2022@gmail.com', mentor: 'Eric Shema Ndamage' },
  { pf: '56742', name: 'Niyonshima Namahoro Parfaite', gender: 'F', email: 'parfaiteniyonshima02@gmail.com', mentor: 'Mukiza Jean Francois Regis' },
  { pf: '56743', name: 'Ndayishimiye Fiston', gender: 'M', email: 'fistonndayishi@gmail.com', mentor: 'Mukiza Jean Francois Regis' },
];

const sessionTemplates = [
  { date: '2026-06-08', topic: 'ECCP Introduction & Scholar Profiles', description: 'Welcome to ECCP 2026! Set up scholar profiles, create Gmail accounts, and understand program expectations. Balancing applications and internships.' },
  { date: '2026-06-09', topic: 'Gmail & Khan Academy Setup', description: 'Create professional Gmail accounts. Set up Khan Academy for SAT diagnostic testing. Guest mentor talk on university applications.' },
  { date: '2026-06-10', topic: 'Application Documents & SAT Introduction', description: 'Overview of application documents needed. Introduction to SAT structure. Fix Microsoft login issues for Bluebook.' },
  { date: '2026-06-11', topic: 'SAT Math Fundamentals', description: 'Core SAT math concepts and strategies. Analytical reading techniques. Begin diagnostic test review.' },
  { date: '2026-06-12', topic: 'Bluebook Installation & Prognostic Test', description: 'Install College Board Bluebook app. Take SAT prognostic test. Review initial scores and set improvement goals.' },
  { date: '2026-06-15', topic: 'University Application Strategies', description: 'Study group formation. Personal statement brainstorming. Develop compelling essay topics.' },
  { date: '2026-06-16', topic: 'Personal Statement Development', description: 'Draft personal statements in Google Docs. Begin activities list and honors list.' },
  { date: '2026-06-17', topic: 'Activities & Honors Lists', description: 'Complete extracurricular activities list. Document honors and awards. SAT Test 5 via Bluebook.' },
  { date: '2026-06-18', topic: 'Common App Account Creation', description: 'Create Common Application accounts. Counselor and teacher brag sheets. Ethical AI use in applications.' },
  { date: '2026-06-19', topic: 'School & Scholarship Research', description: 'Research target universities and scholarships. Assignment: compile list of 10 target schools with requirements.' },
  { date: '2026-06-22', topic: 'Supplementary Essays', description: 'Themed application strategies. UR/Mastercard scholarship information. SAT grammar and math review.' },
  { date: '2026-06-23', topic: 'University Life Session', description: 'Panel discussion on university life. Q&A with current university students.' },
  { date: '2026-06-24', topic: 'Personal Statement Finalization', description: 'Finalize personal statements. Complete activities and honors lists. Recommendation brag sheets.' },
  { date: '2026-06-25', topic: 'Info Sessions: W&L, Davidson, Stanford', description: 'University information sessions. Mental health awareness session. Education USA program overview.' },
  { date: '2026-06-26', topic: 'SAT Practice 8', description: 'Full SAT Practice Test 8 via Bluebook. Review results and identify weak areas.' },
  { date: '2026-06-29', topic: 'Bowdoin & Middlebury Info Sessions', description: 'Live university information sessions. Mentor swap sessions for diverse application advice.' },
  { date: '2026-06-30', topic: 'Japanese Universities & EDFI Session', description: 'Exploring Japanese university options. EDFI entrepreneurship program introduction.' },
  { date: '2026-07-01', topic: 'Haverford, Yale, Duke Info Sessions', description: 'University information sessions. Application materials review with mentors.' },
  { date: '2026-07-02', topic: 'Application Materials Review', description: 'Comprehensive review of all application materials. Peer review sessions.' },
  { date: '2026-07-03', topic: 'ECCP Bootcamp Closeout', description: 'CEO Dr. James Mwangi closeout session. EDFI final meeting. Program evaluation and next steps.' },
];

function seed() {
  const existing = db.prepare('SELECT COUNT(*) as c FROM users').get();
  if (existing.c > 0) {
    console.log('Database already seeded. Skipping...');
    return;
  }

  const insertUser = db.prepare(`
    INSERT INTO users (pf_number, email, password_hash, role, name, gender, phone, school, mentor_id, mentor_bio, mentor_linkedin, mentor_instagram, must_change_password)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const mentorIds = {};

  for (const admin of admins) {
    insertUser.run(null, admin.email.toLowerCase(), ADMIN_PASSWORD, 'admin', admin.name, null, null, null, null, '', '', '', 0);
  }

  for (const mentor of mentors) {
    const result = insertUser.run(null, mentor.email.toLowerCase(), MENTOR_PASSWORD, 'mentor', mentor.name, null, null, null, null,
      `Dedicated ECCP 2026 mentor committed to guiding scholars through the college application journey.`,
      '', '', 0);
    mentorIds[mentor.name] = result.lastInsertRowid;
  }

  for (const mentee of mentees) {
    const mentorId = mentorIds[mentee.mentor] || null;
    insertUser.run(mentee.pf, mentee.email.toLowerCase(), SCHOLAR_PASSWORD, 'mentee', mentee.name, mentee.gender, '', '', mentorId, '', '', '', 1);
  }

  const insertSession = db.prepare(`
    INSERT INTO sessions (date, topic, description, created_by, is_global)
    VALUES (?, ?, ?, 1, 1)
  `);

  for (const s of sessionTemplates) {
    insertSession.run(s.date, s.topic, s.description);
  }

  db.prepare(`INSERT INTO settings (key, value) VALUES ('google_drive_url', '')`).run();
  db.prepare(`INSERT INTO settings (key, value) VALUES ('program_year', '2026')`).run();
  db.prepare(`INSERT INTO settings (key, value) VALUES ('contact_email', 'eccpmentor.regismukiza@gmail.com')`).run();

  console.log(`Seeded: ${admins.length} admins, ${mentors.length} mentors, ${mentees.length} mentees, ${sessionTemplates.length} session templates`);
}

seed();
