/* =============================================================
   DATA — real squads (walla/footballtransfers) injected at build
   ============================================================= */
const RAW=__CLUBS_JSON__;
const RAW_EURO=__EURO_JSON__;
const DATA_META=__DATA_META__;
const PLAYER_VISUALS=__PLAYER_VISUALS__;
const META={
 mta:{short:'מכבי ת"א',city:'תל אביב'},hta:{short:'הפועל ת"א',city:'תל אביב'},mhf:{short:'מכבי חיפה',city:'חיפה'},hbs:{short:'הפועל ב"ש',city:'באר שבע'},
 bje:{short:'בית"ר י-ם',city:'ירושלים'},hhf:{short:'הפועל חיפה',city:'חיפה'},hje:{short:'הפועל י-ם',city:'ירושלים'},mnt:{short:'מכבי נתניה',city:'נתניה'},
 mpt:{short:'מכבי פ"ת',city:'פתח תקווה'},bsk:{short:'בני סכנין',city:'סכנין'},hpt:{short:'הפועל פ"ת',city:'פתח תקווה'},hrg:{short:'הפועל ר"ג',city:'רמת גן'},
 iks:{short:'קריית שמונה',city:'קריית שמונה'},itb:{short:'טבריה',city:'טבריה'}};
const FALLBACK={
 mta:{name:'מכבי תל אביב',stadium:'בלומפילד',cap:29400,colors:['#f5d000','#1d4ed8']},hta:{name:'הפועל תל אביב',stadium:'בלומפילד',cap:29400,colors:['#d81e1e','#ffffff']},
 mhf:{name:'מכבי חיפה',stadium:'סמי עופר',cap:30780,colors:['#1f8a3a','#ffffff']},hbs:{name:'הפועל באר שבע',stadium:'טרנר',cap:16126,colors:['#d81e1e','#ffffff']},
 bje:{name:'בית"ר ירושלים',stadium:'טדי',cap:31733,colors:['#f5d000','#111111']},hhf:{name:'הפועל חיפה',stadium:'סמי עופר',cap:30780,colors:['#d81e1e','#111111']},
 hje:{name:'הפועל ירושלים',stadium:'טדי',cap:31733,colors:['#d81e1e','#ffffff']},mnt:{name:'מכבי נתניה',stadium:'אצטדיון נתניה',cap:13610,colors:['#f5d000','#111111']},
 mpt:{name:'מכבי פתח תקווה',stadium:'המושבה',cap:11500,colors:['#1d4ed8','#ffffff']},bsk:{name:'בני סכנין',stadium:'דוחא',cap:5300,colors:['#d81e1e','#ffffff']},
 hpt:{name:'הפועל פתח תקווה',stadium:'המושבה',cap:11500,colors:['#1d4ed8','#ffffff']},hrg:{name:'הפועל רמת גן',stadium:'רחובות',cap:7000,colors:['#d81e1e','#ffffff']},
 iks:{name:'עירוני קריית שמונה',stadium:'קריית שמונה',cap:5300,colors:['#1d4ed8','#ffffff']},itb:{name:'עירוני טבריה',stadium:'אצטדיון נתניה',cap:13610,colors:['#1d4ed8','#ffffff']}};
/* who qualified for Europe from 2025/26: champion ב"ש, cup winner מכבי ת"א, 2nd בית"ר, next הפועל ת"א */
const EURO_SEEDS={hbs:['CL','Q2'],mta:['EL','Q3'],bje:['ECL','Q2'],hta:['ECL','Q2']};
const LEUMIT=[
 {id:'l_ash',name:'מ.ס. אשדוד',short:'אשדוד',city:'אשדוד',stadium:'אצטדיון אשדוד',cap:7800,c1:'#f5d000',c2:'#d81e1e'},
 {id:'l_rei',name:'מכבי בני ריינה',short:'בני ריינה',city:'ריינה',stadium:'גרין',cap:4000,c1:'#111111',c2:'#f5d000'},
 {id:'l_kfs',name:'הפועל כפר סבא',short:'כפר סבא',city:'כפר סבא',stadium:'לויטה',cap:5800,c1:'#1f8a3a',c2:'#ffffff'},
 {id:'l_byh',name:'בני יהודה',short:'בני יהודה',city:'תל אביב',stadium:'בלומפילד',cap:29400,c1:'#f97316',c2:'#111111'}];
const NAT_HE={'Côte d\'Ivoire':'חוף השנהב','Bosnia-Herzegovina':'בוסניה',Indonesia:'אינדונזיה',Philippines:'הפיליפינים',Uzbekistan:'אוזבקיסטן','Dominican Republic':'הרפובליקה הדומיניקנית','Korea South':'דרום קוריאה',Israel:'ישראל',Guinea:'גינאה',Netherlands:'הולנד',Serbia:'סרביה',Mali:'מאלי',Moldova:'מולדובה','Cape Verde':'כף ורדה',Slovenia:'סלובניה',Venezuela:'ונצואלה',Brazil:'ברזיל',Portugal:'פורטוגל',Ghana:'גאנה',Nigeria:'ניגריה',Spain:'ספרד',Argentina:'ארגנטינה',Croatia:'קרואטיה',Ukraine:'אוקראינה',France:'צרפת',Senegal:'סנגל',Cameroon:'קמרון','Ivory Coast':'חוף השנהב',Colombia:'קולומביה',Uruguay:'אורוגוואי',Romania:'רומניה',Poland:'פולין',Georgia:'גאורגיה',Albania:'אלבניה','North Macedonia':'צפון מקדוניה',Bulgaria:'בולגריה','Bosnia and Herzegovina':'בוסניה',Montenegro:'מונטנגרו',Greece:'יוון',Cyprus:'קפריסין',Belgium:'בלגיה',Germany:'גרמניה',England:'אנגליה',Scotland:'סקוטלנד',Ireland:'אירלנד',Sweden:'שוודיה',Denmark:'דנמרק',Norway:'נורווגיה',Finland:'פינלנד',USA:'ארה"ב','United States':'ארה"ב',Canada:'קנדה',Australia:'אוסטרליה',Japan:'יפן','South Korea':'דרום קוריאה',Chile:'צ\'ילה',Peru:'פרו',Ecuador:'אקוודור',Paraguay:'פרגוואי',Mexico:'מקסיקו',Morocco:'מרוקו',Tunisia:'תוניסיה',Algeria:'אלג\'יריה',Egypt:'מצרים','DR Congo':'קונגו','Burkina Faso':'בורקינה פאסו',Gambia:'גמביה',Togo:'טוגו',Benin:'בנין',Angola:'אנגולה',Zambia:'זמביה',Zimbabwe:'זימבבואה','South Africa':'דרום אפריקה',Kenya:'קניה',Uganda:'אוגנדה',Tanzania:'טנזניה',Ethiopia:'אתיופיה',Hungary:'הונגריה',Austria:'אוסטריה',Switzerland:'שווייץ','Czech Republic':'צ\'כיה',Slovakia:'סלובקיה',Lithuania:'ליטא',Latvia:'לטביה',Estonia:'אסטוניה',Belarus:'בלארוס',Russia:'רוסיה',Kazakhstan:'קזחסטן',Armenia:'ארמניה',Azerbaijan:'אזרבייג\'ן',Turkey:'טורקיה',Italy:'איטליה',Iceland:'איסלנד',Kosovo:'קוסובו',Luxembourg:'לוקסמבורג',Malta:'מלטה',Wales:'ויילס','Northern Ireland':'צפון אירלנד',Jamaica:'ג\'מייקה',Haiti:'האיטי','Trinidad and Tobago':'טרינידד',Curaçao:'קוראסאו',Suriname:'סורינאם',Guyana:'גיאנה',Bolivia:'בוליביה','Costa Rica':'קוסטה ריקה',Honduras:'הונדורס',Panama:'פנמה',Guatemala:'גואטמלה','El Salvador':'אל סלבדור','Equatorial Guinea':'גינאה המשוונית','Guinea-Bissau':'גינאה ביסאו','Sierra Leone':'סיירה לאון',Liberia:'ליבריה',Mauritania:'מאוריטניה',Niger:'ניז\'ר',Chad:'צ\'אד',Sudan:'סודן',Rwanda:'רואנדה',Burundi:'בורונדי',Mozambique:'מוזמביק',Madagascar:'מדגסקר',Namibia:'נמיביה',Botswana:'בוטסואנה',Gabon:'גבון',Congo:'קונגו','Central African Republic':'מרכז אפריקה',Eritrea:'אריתריאה'};
const FIRST=['אבי','יוסי','דני','עומר','איתי','תומר','אור','רועי','ניב','עידן','יונתן','דור','שי','גיא','אלון','ליאור','עמית','נדב','מתן','אייל','אלעד','ירדן','רז','עידו','נועם','אושרי','דולב','בר','עדן','סהר','שון','מוחמד','אחמד','עלי','חאלד','פיראס','ביראם','דיא','אופק','עילאי','יובל','אוראל','אדם','רון','קובי','אריאל'];
const LAST=['כהן','לוי','מזרחי','פרץ','ביטון','דהן','אברהם','פרידמן','מלכה','אזולאי','חדד','גבאי','אוחיון','אלמוג','סבג','דיין','עמר','שלום','ברוך','אסולין','חזיזה','בן שימול','גולן','טוויטו','יחזקאל','בן חמו','קסה','סימן טוב','מור','חוסין','עבד','גאנם','טאהא','סאלח','עוואד','שמש','לוגסי','נחמיאס','קדוש','ועקנין'];
const FOREIGN=[['לוקאס','פריירה'],['מילוש','פטרוביץ\''],['ז\'וזה','אלמיידה'],['דייגו','מרטינס'],['ניקולא','יובאנוביץ\''],['קווין','אוקונור'],['סמבה','דיאלו'],['מאטיאס','רומרו'],['איגור','קובאץ\''],['אנדריי','פופסקו'],['ברונו','סנטוס'],['יוסוף','קונה'],['יאן','נובאק'],['טומאש','הורבאט'],['לוקה','מודריאן'],['פבלו','גרסיה'],['מרקו','ריביירו'],['סטפן','ילאץ\''],['איוון','פטרוב'],['יורגן','הנסן']];
const EURO_COUNTRIES=['אוסטריה','שווייץ','צ\'כיה','דנמרק','פולין','נורווגיה','שוודיה','סרביה','קרואטיה','קפריסין','יוון','הונגריה','סלובקיה','רומניה','בולגריה','סלובניה','סקוטלנד','בלגיה','הולנד','פורטוגל','טורקיה','אוקראינה','אזרבייג\'ן','קזחסטן','איסלנד','אירלנד','ליטא','לטביה','אסטוניה','מולדובה','ארמניה','גאורגיה','בוסניה','מונטנגרו','צפון מקדוניה','אלבניה','קוסובו','פינלנד','לוקסמבורג','מלטה','ויילס'];
const BIG_COUNTRIES=['ספרד','אנגליה','גרמניה','איטליה','צרפת','פורטוגל','הולנד','בלגיה'];
const SPONSORS=['טכנו-נט','ביטוח הצפון','קפה הארץ','בנק הגליל','סולאר ים','נדל"ן אופק','מזון ברק','אנרגיה כחולה','מרקט פלוס','סייבר-איי','תקשורת זהב','תדלוק הנגב','ביטוח נבון','סל-מקס','מלונות הים','שחקים קרגו','מים חיים','חשמל ירוק','פייבר-טק','אופטיקה הדר'];
const FORMATIONS={'4-3-3':[1,4,3,3],'4-4-2':[1,4,4,2],'4-2-3-1':[1,4,5,1],'3-5-2':[1,3,5,2],'5-3-2':[1,5,3,2],'3-4-3':[1,3,4,3]};
const POS=['GK','DF','MF','FW'];
const POSHE={GK:'שוער',DF:'הגנה',MF:'קישור',FW:'התקפה'};
const COMP_HE={CL:'ליגת האלופות',EL:'הליגה האירופית',ECL:'קונפרנס ליג'};
const STAGE_HE={Q2:'סיבוב מוקדמות 2',Q3:'סיבוב מוקדמות 3',PO:'פלייאוף המוקדמות',LP:'שלב הליגה',KOPO:'פלייאוף הנוקאאוט',R16:'שמינית הגמר',QF:'רבע הגמר',SF:'חצי הגמר',F:'הגמר',out:'הודחה',W:'זכתה'};
const CUP_HE={R16:'שמינית גמר גביע המדינה',QF:'רבע גמר גביע המדינה',SF:'חצי גמר גביע המדינה',F:'גמר גביע המדינה'};
const PRIZE={CL:{Q2:2e6,Q3:3e6,PO:4e6,LP:75e6,win:8.4e6,draw:2.8e6,KOPO:4e6,R16:44e6,QF:50e6,SF:60e6,F:75e6,W:26e6},
 EL:{Q3:1e6,PO:1.5e6,LP:17e6,win:1.8e6,draw:.6e6,KOPO:1.2e6,R16:7e6,QF:10e6,SF:17e6,F:28e6,W:14e6},
 ECL:{Q2:.6e6,Q3:.8e6,PO:1.2e6,LP:13e6,win:1.6e6,draw:.5e6,KOPO:.8e6,R16:3.2e6,QF:4.8e6,SF:8e6,F:14e6,W:5e6}};
const LP_MATCHES={CL:8,EL:8,ECL:6};
const EURO_STR={CL:{Q2:[60,68],Q3:[64,72],PO:[68,76],LP:[70,84],KOPO:[72,80],R16:[76,86],QF:[78,88],SF:[80,90],F:[82,90]},
 EL:{Q3:[62,70],PO:[66,74],LP:[66,78],KOPO:[68,76],R16:[70,80],QF:[72,82],SF:[74,84],F:[76,86]},
 ECL:{Q2:[56,64],Q3:[60,68],PO:[62,70],LP:[62,72],KOPO:[64,72],R16:[66,74],QF:[68,76],SF:[70,78],F:[72,80]}};
const TRAIN_COST=[0,5e6,10e6,18e6,30e6], ACAD_COST=[0,3e6,6e6,10e6,16e6];
const WINDOW=w=>{for(let i=w;i<G.cal.length;i++){const ev=G.cal[i];if(ev.t==='league')return ev.n<=6||(ev.n>=17&&ev.n<=19)}return true};
const MAX_SUBS=5, MAX_FOREIGN_XI=6;

