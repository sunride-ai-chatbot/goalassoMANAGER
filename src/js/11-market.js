/* ====================== WORLD MARKET: leagues, hidden ratings, scouts, negotiations ====================== */
const WORLD_LEAGUES={
 epl:{name:'פרמייר ליג',country:'אנגליה',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',str:78,vmult:3.0,wmult:6,region:'uk',level:3,pool:'en',foreign:.55,
   clubs:[['ליברפול','ליברפול','#c8102e','#ffffff',87],['ארסנל','לונדון','#ef0107','#ffffff',86],['מנצ\'סטר סיטי','מנצ\'סטר','#6cabdd','#ffffff',88],['צ\'לסי','לונדון','#034694','#ffffff',83],['מנצ\'סטר יונייטד','מנצ\'סטר','#da291c','#ffffff',81],['טוטנהאם','לונדון','#ffffff','#132257',80],['ניוקאסל','ניוקאסל','#241f20','#ffffff',80],['אסטון וילה','ברמינגהאם','#95bfe5','#670e36',80],['ברייטון','ברייטון','#0057b8','#ffffff',76],['ווסטהאם','לונדון','#7a263a','#1bb1e7',74],['אברטון','ליברפול','#003399','#ffffff',72],['קריסטל פאלאס','לונדון','#1b458f','#c4122e',74]]},
 champ:{name:'הצ\'מפיונשיפ',country:'אנגליה',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',str:66,vmult:1.4,wmult:1.8,region:'uk',level:2,pool:'en',foreign:.3,
   clubs:[['שפילד ונסדיי','שפילד','#0e63ad','#ffffff',65],['מידלסברו','מידלסברו','#e03a3e','#ffffff',67],['נוריץ\' סיטי','נוריץ\'','#fff200','#00a650',67],['ווסט ברומיץ\'','ווסט ברומיץ\'','#122f67','#ffffff',66],['קובנטרי','קובנטרי','#5fb4e5','#ffffff',66],['בריסטול סיטי','בריסטול','#e21c38','#ffffff',65],['האל סיטי','האל','#f5a12d','#000000',64],['סטוק סיטי','סטוק','#e03a3e','#ffffff',64],['קווינס פארק ריינג\'רס','לונדון','#1d5ba4','#ffffff',63],['בלקבורן','בלקבורן','#009ee0','#ffffff',63],['סוונזי','סוונזי','#ffffff','#000000',64],['מילוול','לונדון','#001d5e','#ffffff',63]]},
 laliga:{name:'לה ליגה',country:'ספרד',flag:'🇪🇸',str:76,vmult:2.5,wmult:4.5,region:'iberia',level:3,pool:'es',foreign:.4,
   clubs:[['ריאל מדריד','מדריד','#ffffff','#1e3a8a',88],['ברצלונה','ברצלונה','#a50044','#004d98',87],['אתלטיקו מדריד','מדריד','#ce3524','#ffffff',83],['סביליה','סביליה','#ffffff','#d8161e',75],['ויאריאל','ויאריאל','#ffe500','#005187',78],['אתלטיק בילבאו','בילבאו','#ee2523','#ffffff',78],['ריאל סוסיאדד','סן סבסטיאן','#0a6bb5','#ffffff',77],['ריאל בטיס','סביליה','#00954c','#ffffff',75],['ולנסיה','ולנסיה','#ffffff','#f7a600',72],['סלטה ויגו','ויגו','#8ac3ee','#ffffff',72],['אוסאסונה','פמפלונה','#d91a21','#0a346f',71],['חטאפה','חטאפה','#005999','#ffffff',70]]},
 segunda:{name:'לה ליגה 2',country:'ספרד',flag:'🇪🇸',str:63,vmult:1.1,wmult:1.2,region:'iberia',level:2,pool:'es',foreign:.2,
   clubs:[['ריאל סראגוסה','סראגוסה','#ffffff','#1d4ed8',63],['ספורטינג חיחון','חיחון','#e30613','#ffffff',63],['ראסינג סנטנדר','סנטנדר','#0a7c3e','#ffffff',64],['דפורטיבו לה קורוניה','לה קורוניה','#1d4ed8','#ffffff',65],['מלאגה','מלאגה','#5bc2e7','#ffffff',62],['אלמריה','אלמריה','#e30613','#ffffff',64],['גרנאדה','גרנאדה','#e30613','#ffffff',63],['קאדיס','קאדיס','#ffd200','#1d4ed8',62],['לאס פאלמאס','לאס פאלמאס','#ffd200','#1d4ed8',64],['אייבר','אייבר','#1d4ed8','#8b0000',61]]},
 portugal:{name:'ליגת פורטוגל',country:'פורטוגל',flag:'🇵🇹',str:70,vmult:1.6,wmult:1.6,region:'iberia',level:3,pool:'pt',foreign:.45,
   clubs:[['בנפיקה','ליסבון','#e20e0e','#ffffff',80],['פורטו','פורטו','#003f8c','#ffffff',80],['ספורטינג ליסבון','ליסבון','#008057','#ffffff',80],['בראגה','בראגה','#d41b1b','#ffffff',72],['ויטוריה גימראיש','גימראיש','#ffffff','#000000',68],['פאמליקאו','פאמליקאו','#1d4ed8','#ffffff',64],['ריו אבה','וילה דו קונדה','#0a7c3e','#ffffff',63],['בואביסטה','פורטו','#000000','#ffffff',62],['אסטוריל','אסטוריל','#ffd200','#1d4ed8',63],['קאזה פיה','ליסבון','#000000','#ffffff',62]]},
 bundes:{name:'בונדסליגה',country:'גרמניה',flag:'🇩🇪',str:75,vmult:2.3,wmult:4,region:'core',level:3,pool:'de',foreign:.45,
   clubs:[['באיירן מינכן','מינכן','#dc052d','#ffffff',88],['בורוסיה דורטמונד','דורטמונד','#fde100','#000000',82],['באייר לברקוזן','לברקוזן','#e32221','#000000',82],['לייפציג','לייפציג','#dd0741','#ffffff',79],['שטוטגרט','שטוטגרט','#ffffff','#e32219',76],['איינטרכט פרנקפורט','פרנקפורט','#000000','#e1000f',77],['פרייבורג','פרייבורג','#000000','#e30613',73],['וולפסבורג','וולפסבורג','#65b32e','#ffffff',72],['מיינץ','מיינץ','#c3141e','#ffffff',71],['אוניון ברלין','ברלין','#eb1923','#ffd200',70],['הופנהיים','זינסהיים','#1961ac','#ffffff',71],['ורדר ברמן','ברמן','#1d9053','#ffffff',71]]},
 seriea:{name:'סרייה א\'',country:'איטליה',flag:'🇮🇹',str:75,vmult:2.2,wmult:4,region:'core',level:3,pool:'it',foreign:.5,
   clubs:[['אינטר','מילאנו','#010e80','#000000',86],['מילאן','מילאנו','#fb090b','#000000',81],['יובנטוס','טורינו','#000000','#ffffff',82],['נאפולי','נאפולי','#12a0d7','#ffffff',82],['אטאלנטה','ברגאמו','#1e71b8','#000000',79],['רומא','רומא','#8e1f2f','#f0bc42',77],['לאציו','רומא','#87d8f7','#ffffff',76],['פיורנטינה','פירנצה','#482e92','#ffffff',75],['בולוניה','בולוניה','#1a2f48','#a21c26',74],['טורינו','טורינו','#8a1e03','#ffffff',71],['אודינזה','אודינה','#000000','#ffffff',70],['ג\'נואה','ג\'נובה','#a00000','#1d4ed8',70]]},
 ligue1:{name:'ליג 1',country:'צרפת',flag:'🇫🇷',str:73,vmult:2.0,wmult:3.5,region:'core',level:3,pool:'fr',foreign:.5,
   clubs:[['פאריס סן ז\'רמן','פריז','#004170','#da291c',88],['מונאקו','מונאקו','#e63312','#ffffff',78],['ליל','ליל','#e01e13','#ffffff',76],['מארסיי','מרסיי','#ffffff','#2faee0',77],['ליון','ליון','#ffffff','#da001a',75],['ניס','ניס','#000000','#e0001b',73],['לאנס','לאנס','#ffd200','#e30613',73],['רן','רן','#e30613','#000000',72],['שטרסבורג','שטרסבורג','#1d4ed8','#ffffff',70],['טולוז','טולוז','#5a2d82','#ffffff',69]]},
 eredivisie:{name:'ארדיוויזי',country:'הולנד',flag:'🇳🇱',str:69,vmult:1.4,wmult:1.5,region:'core',level:2,pool:'nl',foreign:.4,
   clubs:[['אייאקס','אמסטרדם','#ffffff','#d2122e',77],['פ.ס.וו איינדהובן','איינדהובן','#ed1c24','#ffffff',79],['פיינורד','רוטרדם','#e2001a','#ffffff',76],['א.ז. אלקמאר','אלקמאר','#e1261c','#ffffff',72],['טוונטה','אנסחדה','#e10a0a','#ffffff',70],['אוטרכט','אוטרכט','#e30613','#ffffff',68],['חו אהד איגלס','דוונטר','#e30613','#ffd200',64],['ספרטה רוטרדם','רוטרדם','#e30613','#ffffff',64],['הירנפיין','הירנפיין','#1d4ed8','#ffffff',63],['נ.א.צ. ברדה','ברדה','#ffd200','#000000',62]]},
 belgium:{name:'ליגת בלגיה',country:'בלגיה',flag:'🇧🇪',str:67,vmult:1.2,wmult:1.3,region:'core',level:2,pool:'nl',foreign:.5,
   clubs:[['קלאב ברוז\'','ברוז\'','#0070b8','#000000',75],['אנדרלכט','בריסל','#582c83','#ffffff',70],['רויאל אנטוורפן','אנטוורפן','#d4151c','#ffffff',69],['גנק','גנק','#1b4d9b','#ffffff',69],['יוניון סן ז\'ילואז','בריסל','#ffd200','#1d4ed8',71],['גנט','גנט','#1d4ed8','#ffffff',67],['סטנדרד ליאז\'','ליאז\'','#e30613','#ffffff',65],['שרלרואה','שרלרואה','#000000','#ffffff',63],['מכלן','מכלן','#ffd200','#e30613',63],['סנט טרוידן','סנט טרוידן','#ffd200','#1d4ed8',62]]},
 scand:{name:'סקנדינביה',country:'סקנדינביה',flag:'🇩🇰',str:63,vmult:1.0,wmult:1.1,region:'east',level:2,pool:'sc',foreign:.3,
   clubs:[['קופנהאגן','קופנהאגן','#ffffff','#1d4ed8',70],['מידטיולאן','הרנינג','#000000','#e31b23',66],['ברונדבי','ברונדבי','#ffd200','#1d4ed8',62],['בודה/גלימט','בודה','#ffd200','#000000',70],['מולדה','מולדה','#1d4ed8','#ffffff',62],['ברן','ברגן','#e31b23','#ffffff',60],['מאלמו','מאלמו','#5bc2e7','#ffffff',64],['יורגורדן','סטוקהולם','#1d4ed8','#ffffff',60],['האמרבי','סטוקהולם','#0a7c3e','#ffffff',61],['ה.י.ק הלסינקי','הלסינקי','#1d4ed8','#ffffff',56]]},
 east:{name:'מזרח אירופה',country:'מזרח אירופה',flag:'🇵🇱',str:63,vmult:.9,wmult:.9,region:'east',level:2,pool:'pl',foreign:.3,
   clubs:[['לגיה ורשה','ורשה','#ffffff','#00844a',66],['לך פוזנן','פוזנן','#1d4ed8','#ffffff',64],['ספרטה פראג','פראג','#8b0000','#ffd200',70],['סלאביה פראג','פראג','#e31b23','#ffffff',71],['ויקטוריה פלזן','פלזן','#1d4ed8','#e31b23',66],['פרנצווארוש','בודפשט','#0a7c3e','#ffffff',66],['פ.צ.ס.ב בוקרשט','בוקרשט','#e31b23','#1d4ed8',64],['לודוגורץ ראזגרד','ראזגרד','#0a7c3e','#ffffff',64],['שחטאר דונייצק','דונייצק','#f36f21','#000000',72],['דינמו קייב','קייב','#ffffff','#1d4ed8',68]]},
 balkan:{name:'הבלקן',country:'הבלקן',flag:'🇷🇸',str:61,vmult:.8,wmult:.7,region:'east',level:1,pool:'sr',foreign:.2,
   clubs:[['הכוכב האדום בלגרד','בלגרד','#e31b23','#ffffff',70],['פרטיזן בלגרד','בלגרד','#000000','#ffffff',64],['דינמו זאגרב','זאגרב','#1d4ed8','#ffffff',70],['הייד"וק ספליט','ספליט','#ffffff','#1d4ed8',64],['רייקה','רייקה','#ffffff','#1d4ed8',62],['אולימפיה ליובליאנה','ליובליאנה','#0a7c3e','#ffffff',60],['מאריבור','מאריבור','#5a2d82','#ffd200',58],['זרינסקי מוסטאר','מוסטאר','#e31b23','#ffffff',56],['וויבודינה','נובי סאד','#e31b23','#ffffff',58],['אוסייק','אוסייק','#1d4ed8','#ffffff',59]]},
 africa:{name:'אפריקה',country:'אפריקה',flag:'🌍',str:60,vmult:.55,wmult:.5,region:'africa',level:1,pool:'af',foreign:.1,
   clubs:[['אל-אהלי','קהיר','#e30613','#ffffff',70,'ar','מצרים'],['זמאלק','קהיר','#ffffff','#e30613',66,'ar','מצרים'],['פירמידס','קהיר','#1d4ed8','#ffffff',65,'ar','מצרים'],['וידאד קזבלנקה','קזבלנקה','#e30613','#ffffff',66,'ar','מרוקו'],['ראג\'ה קזבלנקה','קזבלנקה','#0a7c3e','#ffffff',65,'ar','מרוקו'],['אספראנס טוניס','תוניס','#ffd200','#e30613',66,'ar','תוניסיה'],['ממלודי סאנדאונס','פרטוריה','#ffd200','#1d4ed8',67,'af','דרום אפריקה'],['אורלנדו פיראטס','יוהנסבורג','#000000','#ffffff',63,'af','דרום אפריקה'],['קייזר צ\'יפס','יוהנסבורג','#ffd200','#000000',61,'af','דרום אפריקה'],['אנימבה','אבה','#1d4ed8','#ffffff',58,'af','ניגריה'],['טי.פי מאזמבה','לובומבאשי','#000000','#ffffff',60,'af','קונגו'],['אסאנטה קוטוקו','קומאסי','#e30613','#ffd200',58,'af','גאנה'],['סימבה','דאר א-סלאם','#e30613','#ffffff',58,'af','טנזניה'],['יאנג אפריקנס','דאר א-סלאם','#0a7c3e','#ffd200',57,'af','טנזניה']]},
 samerica:{name:'דרום אמריקה',country:'דרום אמריקה',flag:'🌎',str:68,vmult:.9,wmult:1.0,region:'americas',level:2,pool:'br',foreign:.1,
   clubs:[['פלמנגו','ריו','#e30613','#000000',77,'br','ברזיל'],['פלמייראס','סאו פאולו','#0a7c3e','#ffffff',77,'br','ברזיל'],['סאו פאולו','סאו פאולו','#ffffff','#e30613',72,'br','ברזיל'],['קורינתיאנס','סאו פאולו','#000000','#ffffff',71,'br','ברזיל'],['פלומיננסה','ריו','#8b0000','#0a7c3e',71,'br','ברזיל'],['בוקה ג\'וניורס','בואנוס איירס','#1d4ed8','#ffd200',73,'ar_s','ארגנטינה'],['ריבר פלייט','בואנוס איירס','#ffffff','#e30613',74,'ar_s','ארגנטינה'],['ראסינג קלוב','אבייאנדה','#5bc2e7','#ffffff',69,'ar_s','ארגנטינה'],['אינדפנדיינטה','אבייאנדה','#e30613','#ffffff',67,'ar_s','ארגנטינה'],['פניארול','מונטווידאו','#ffd200','#000000',66,'ar_s','אורוגוואי'],['נסיונל','מונטווידאו','#ffffff','#1d4ed8',65,'ar_s','אורוגוואי'],['אתלטיקו נסיונל','מדיין','#0a7c3e','#ffffff',66,'ar_s','קולומביה'],['קולו-קולו','סנטיאגו','#ffffff','#000000',64,'ar_s','צ\'ילה']]},
 europe:{name:'עוד באירופה',country:'אירופה',flag:'🇪🇺',str:72,vmult:1.4,wmult:1.5,region:'core',level:2,pool:'de',foreign:.45,
   clubs:[['סלטיק','גלאזגו','#018749','#ffffff',73,'en','סקוטלנד'],['ריינג\'רס','גלאזגו','#1b458f','#ffffff',71,'en','סקוטלנד'],['גלאטסראיי','איסטנבול','#fdb912','#a90432',76,'tr','טורקיה'],['פנרבחצ\'ה','איסטנבול','#fff200','#00245d',75,'tr','טורקיה'],['אולימפיאקוס','פיראוס','#e4002b','#ffffff',73,'gr','יוון'],['רד בול זלצבורג','זלצבורג','#ffffff','#e30613',72,'de','אוסטריה'],['יאנג בויז','ברן','#ffd500','#000000',70,'de','שווייץ']]},
 mls:{name:'MLS',country:'ארה"ב',flag:'🇺🇸',str:64,vmult:1.1,wmult:1.6,region:'americas',level:2,pool:'us',foreign:.45,
   clubs:[['אינטר מיאמי','מיאמי','#f7b5cd','#000000',68],['לוס אנג\'לס אף.סי','לוס אנג\'לס','#000000','#c39e6d',67],['אל.איי גלאקסי','לוס אנג\'לס','#ffffff','#00245d',66],['אטלנטה יונייטד','אטלנטה','#80000b','#a19060',64],['סיאטל סאונדרס','סיאטל','#5d9741','#1d4ed8',65],['קולומבוס קרו','קולומבוס','#ffd200','#000000',65],['פילדלפיה יוניון','פילדלפיה','#071b2c','#b38707',63],['סינסינטי','סינסינטי','#f05323','#263b80',65],['ניו יורק סיטי','ניו יורק','#6cabdd','#041e42',63],['אורלנדו סיטי','אורלנדו','#633492','#fde192',63]]},
};
const REGIONS={uk:{name:'בריטניה',leagues:['epl','champ']},iberia:{name:'ספרד ופורטוגל',leagues:['laliga','segunda','portugal']},core:{name:'מערב אירופה',leagues:['bundes','seriea','ligue1','eredivisie','belgium','europe']},east:{name:'מזרח אירופה והבלקן',leagues:['east','balkan','scand']},africa:{name:'אפריקה',leagues:['africa']},americas:{name:'אמריקה',leagues:['samerica','mls']}};
const EXTRA_POOLS={
 ar:[['מוחמד','אחמד','מחמוד','עומר','יוסף','כרים','אמין','חמזה','ריאן','זכריא','עבדאללה','איימן','ביל אל','אשרף'],['חסן','עלי','עבד אל-רחמן','מחמוד','אל-סייד','אמארה','בן עלי','בוחדוז','בן מוסא','מראבט','חדאד','עליוי','אל-שאמי','טאהר']],
 br:[['גבריאל','מתאוס','ויניסיוס','לוקאס','פליפה','קאיו','רפאל','ברונו','אנדרסון','דוגלאס','תיאגו','ז\'ואאו','פדרו','מרסלו','אדוארדו'],['סילבה','סנטוס','אוליביירה','סוזה','רודריגס','פריירה','לימה','גומס','קוסטה','ריביירו','מרטינס','אראוז\'ו','פרננדס','ברבוזה']],
 ar_s:[['סנטיאגו','חואן','ניקולאס','פדרו','מטיאס','לאוטרו','פקונדו','גונסאלו','אגוסטין','טומאס','חואקין','אמיליאנו','לוקאס'],['גונסאלס','רודריגס','פרננדס','לופס','מרטינס','גומס','דיאס','רומרו','אלברס','טורס','פרס','סאנצ\'ס','אקוניה','קאסטרו']],
 us:[['טיילר','ברנדון','ג\'ורדן','קיילב','אוסטין','ג\'ושוע','איתן','דילן','מייסון','לוגן','בריידן','כריסטיאן'],['ג\'ונסון','וויליאמס','מילר','דייוויס','אנדרסון','מרטינס','ג\'קסון','תומפסון','גרסיה','רובינסון','ריד','מורגן']],
};
const POOL_NAT={en:'אנגליה',es:'ספרד',pt:'פורטוגל',it:'איטליה',fr:'צרפת',de:'גרמניה',nl:'הולנד',sc:'דנמרק',pl:'פולין',sr:'סרביה',cs:'צ\'כיה',hu:'הונגריה',ro:'רומניה',bg:'בולגריה',ua:'אוקראינה',tr:'טורקיה',gr:'יוון',br:'ברזיל',ar_s:'ארגנטינה',us:'ארה"ב',ar:'מצרים',af:'ניגריה',fi:'פינלנד',lt:'ליטא',kz:'קזחסטן',al:'אלבניה'};
const AF_NATS=['ניגריה','גאנה','סנגל','חוף השנהב','קמרון','מאלי','גינאה','דרום אפריקה','קונגו','בורקינה פאסו','גמביה','זמביה'];
const ISRAELI_ABROAD_CHANCE={champ:.08,belgium:.08,eredivisie:.06,scand:.06,east:.05,portugal:.04,segunda:.04,epl:.02,bundes:.02,seriea:.02,laliga:.01,ligue1:.02,mls:.05,balkan:.03,africa:0,samerica:0};
function poolOf(k){return NAME_POOLS[k]||EXTRA_POOLS[k]||NAME_POOLS.de}
function worldName(lg,clubDef){
  const L=WORLD_LEAGUES[lg];const localKey=clubDef[5]||L.pool;const localNat=clubDef[6]||POOL_NAT[localKey]||L.country;
  if(Math.random()<(ISRAELI_ABROAD_CHANCE[lg]||0))return {name:[pick(FIRST),pick(LAST)],nat:'ישראל',foreign:false};
  if(Math.random()<L.foreign){const k=pick(['af','br','ar_s','es','pt','fr','nl','sr','de','en','ar','sc','pl']);const pool=poolOf(k);const nat=k==='af'?pick(AF_NATS):POOL_NAT[k];return {name:[pick(pool[0]),pick(pool[1])],nat,foreign:true}}
  const pool=poolOf(localKey);return {name:[pick(pool[0]),pick(pool[1])],nat:localKey==='af'?(clubDef[6]||pick(AF_NATS)):localNat,foreign:true};
}
function makeWorldPlayer(lg,clubDef,kind,str){
  const L=WORLD_LEAGUES[lg];const {name,nat,foreign}=worldName(lg,clubDef);
  let age,ovr,pos=pick(['GK','DF','DF','DF','MF','MF','MF','FW','FW']);
  if(kind==='young'){age=ri(18,21);ovr=clamp(Math.round(str-9+gauss()*3),46,86)}
  else if(kind==='vet'){age=ri(30,34);ovr=clamp(Math.round(str-3+gauss()*3),46,88)}
  else{age=ri(22,29);ovr=clamp(Math.round(str-5+gauss()*3),46,88)}
  const p=finalize({id:uid++,first:name[0],last:name[1],pos,age,nat,foreign,ovr,pot:kind==='young'?clamp(ovr+ri(6,16),ovr,92):potentialFor(ovr,age),form:0,yellow:0,inj:0,susp:0,goals:0,apps:0,contract:ri(1,4),morale:65,fit:100,real:false,kn:0,lg,vmult:L.vmult,wmult:L.wmult});
  const h=(p.id*2246822519)>>>0;p.est=ovr+((h%7)-3);p.key=kind==='vet'&&ovr>=str;
  return p;
}
/* Real squads (data/euro) appear in full in the world market. The 11 most valuable players are the club's core and
   are listed as "in squad, not for sale" (p.nfs); everyone else can be bought. Clubs without real data keep their
   generated 7-player transfer list. */
const WORLD_CORE=11;
function prepWorldPlayer(p,lg,L,str){p.kn=p.kn??0;p.lg=lg;p.vmult=p.rv?clamp(p.rv/Math.max(p.value,1e5),.1,8):L.vmult;const pw=playerWage(p);const cw=Math.max(pw*.9,Math.min(pw*L.wmult,(p.rv||0)*.009));p.wmult=Math.round(cw/pw*100)/100;const h=(p.id*2246822519)>>>0;p.est=p.ovr+((h%7)-3);p.key=p.ovr>=str+1;p.real=true;return p}
function markWorldCore(c){const ps=c.players.filter(p=>p.real&&p.en);const byVal=ps.slice().sort((a,b)=>(b.rv||b.value)-(a.rv||a.value));const core=new Set(byVal.slice(0,WORLD_CORE).map(p=>p.id));for(const p of ps)p.nfs=core.has(p.id)}
/* names of real players already somewhere in the career (bought, moved, free agents): never duplicated by a top-up */
function realKey(p){return p.en+'|'+(p.rv||'')}
function careerRealNames(){const s=new Set();const add=p=>{if(p&&p.en)s.add(realKey(p))};for(const c of [...(G.clubs||[]),...(G.leumit||[]),...worldClubs()])(c.players||[]).forEach(add);(G.freeAgents||[]).forEach(add);return s}
/* fills a real club up to its full data/euro squad (idempotent; keeps existing players and their ids) */
function fillRealWorldSquad(c,lg){const L=WORLD_LEAGUES[lg];const all=rawSquad(c.name,c.str);if(!all)return false;
  const have=careerRealNames();const busy=new Set((G.negs||[]).filter(n=>n.stage==='club'||n.stage==='player').map(n=>n.pid));
  // a real club never shows invented players as part of its real squad
  c.players=c.players.filter(p=>p.real&&p.en||busy.has(p.id));
  for(const p of all){if(have.has(realKey(p)))continue;c.players.push(prepWorldPlayer(p,lg,L,c.str));have.add(realKey(p))}
  c.realSquad=true;c.squadV=2;markWorldCore(c);return true}
function ensureWorldLeague(lg){
  if(!G.world)G.world={};if(G.world[lg]){for(const c of G.world[lg].clubs)if(c.realSquad&&c.squadV!==2)fillRealWorldSquad(c,lg);return G.world[lg]}
  const L=WORLD_LEAGUES[lg];const clubs=L.clubs.map(def=>{const [name,city,c1,c2,str]=def;const c={id:'w'+(uid++),name,short:name,city,country:def[6]||L.country,stadium:'',c1,c2,str,lg,league:false,world:true,pseudo:true,players:[],youth:[],money:0,tier:str>=76?1:str>=66?2:3,fans:60,P:0,W:0,D:0,L:0,GF:0,GA:0,pts:0};
    if(RAW_EURO&&RAW_EURO[name]&&RAW_EURO[name].length>=14)fillRealWorldSquad(c,lg)
    else{const kinds=['young','young','mid','mid','mid','vet','vet'];for(const k of kinds)c.players.push(makeWorldPlayer(lg,def,k,str))}return c});
  G.world[lg]={clubs};return G.world[lg];
}
/* v9: careers saved with 7-player world lists get the full real squads; players remember their origin club so their
   face resolves after a transfer */
function migrateWorldSquads(){if(!G.world)return;for(const [lg,l] of Object.entries(G.world)){if(!WORLD_LEAGUES[lg])continue;for(const c of l.clubs||[]){if(!c.realSquad)continue;for(const p of c.players)if(p.en&&!p.from)p.from=c.name;if(c.squadV!==2)fillRealWorldSquad(c,lg)}}}
function ensureAllWorldLeagues(){for(const lg of Object.keys(WORLD_LEAGUES))ensureWorldLeague(lg)}
function worldClubs(){return G.world?Object.values(G.world).flatMap(l=>l.clubs):[]}
function wclub(id){return worldClubs().find(c=>c.id===id)}
function findWorldPlayer(pid){for(const c of worldClubs()){const p=c.players.find(x=>x.id===pid);if(p)return {p,c}}return null}
function marketValue(p){return Math.round(p.value*(p.vmult||1)/1e4)*1e4}
function knownRange(p){const h=(p.id*2654435761)>>>0;const w=p.kn===1?3:7;return [clamp(p.ovr-w-(h%3),30,95),clamp(p.ovr+w-(h>>3)%3,30,95)]}
function shownOvr(p){if(p.kn==null||p.kn>=2)return String(p.ovr);if(p.kn===1)return '~'+p.est;const [lo,hi]=knownRange(p);return lo+'–'+hi}
function isKnown(p){return p.kn==null||p.kn>=2}
function leagueOf(p){return p.lg?WORLD_LEAGUES[p.lg]:null}

/* ---- scouting department ---- */
const SCOUT_LEVEL={1:{max:1,cost:0},2:{max:2,cost:2.5e6},3:{max:4,cost:6e6}};
const SCOUT_FIRST=['אבי','יוסי','איציק','משה','שלומי','ניר','עמוס','גיל','רוני','אלי','דודו','ערן','חיים','בני','מוטי','אורן'];
const SCOUT_LAST=['בן שמעון','לוי','כהן','אזולאי','פרץ','ביטון','מלכה','סבג','גרשון','חדד','קדוש','אבוקסיס','גוטמן','שרף','רביבו','אלקיים'];
function makeScoutCandidate(){const q=pick([1,2,2,3,3,3,4,4,5]);const region=pick(Object.keys(REGIONS));const foreign=Math.random()<.3;
  const name=foreign?(()=>{const k=pick(['es','pt','sr','nl','en','br']);const pool=poolOf(k);return pick(pool[0])+' '+pick(pool[1])})():pick(SCOUT_FIRST)+' '+pick(SCOUT_LAST);
  return {id:uid++,name,q,home:region,wage:q*14000+ri(0,4)*1000,bio:pick(['שחקן עבר','מאמן נוער לשעבר','סוכן לשעבר','אנליסט וידאו','עיתונאי ספורט לשעבר','מנהל מקצועי לשעבר'])}}
function refreshScoutMarket(){G.scoutMarket=[];for(let i=0;i<5;i++)G.scoutMarket.push(makeScoutCandidate())}
function hireScout(id){const c=me();const s=(G.scoutMarket||[]).find(x=>x.id===id);if(!s)return;const lvl=c.scouting||1;
  if((G.scouts||[]).length>=SCOUT_LEVEL[lvl].max)return toast(`מחלקת הסקאוטינג ברמה ${lvl} מאפשרת עד ${SCOUT_LEVEL[lvl].max} סקאוטים`);
  G.scouts=G.scouts||[];G.scouts.push({...s,region:s.home,timer:s.q>=4?2:3,brief:{pos:'all',maxAge:30,budget:'any'},reports:0});G.scoutMarket=G.scoutMarket.filter(x=>x!==s);
  news(`${s.name} הצטרף למערך הסקאוטינג (${REGIONS[s.home].name}).`);toast('הסקאוט נשכר');save();render()}
function fireScout(id){const s=(G.scouts||[]).find(x=>x.id===id);if(!s)return;G.scouts=G.scouts.filter(x=>x!==s);news(`${s.name} סיים את תפקידו במערך הסקאוטינג.`);save();render()}
function setScoutRegion(id,region){const s=(G.scouts||[]).find(x=>x.id===id);if(!s)return;if(s.region!==region){s.region=region;s.timer=Math.max(s.timer,2)}save();render()}
function setScoutBrief(id,key,val){const s=(G.scouts||[]).find(x=>x.id===id);if(!s)return;s.brief[key]=key==='maxAge'?+val:val;save();render()}
function upgradeScouting(){const c=me();const lvl=c.scouting||1;if(lvl>=3)return toast('מחלקת הסקאוטינג ברמה המקסימלית');const cost=SCOUT_LEVEL[lvl+1].cost;if(c.money<cost)return toast('אין מספיק תקציב');c.money-=cost;c.scouting=lvl+1;addLog('שדרוג מחלקת סקאוטינג',-cost);toast(`מחלקת הסקאוטינג ברמה ${c.scouting}`);save();render()}
function scoutTick(){
  const c=me();if(!G.scouts||!G.scouts.length)return;
  for(const s of G.scouts){c.money-=s.wage;addLog(`שכר סקאוט ${s.name}`,-s.wage);s.timer--;if(s.timer>0)continue;
    s.timer=s.q>=4?2:3;const leagues=REGIONS[s.region].leagues;leagues.forEach(ensureWorldLeague);
    let pool=leagues.flatMap(lg=>G.world[lg].clubs.flatMap(cl=>cl.players.map(p=>({p,cl}))));
    const b=s.brief;pool=pool.filter(x=>!x.p.rep&&!x.p.nfs&&(b.pos==='all'||x.p.pos===b.pos)&&x.p.age<=b.maxAge&&(b.budget==='any'||marketValue(x.p)*1.2<=(b.budget==='half'?c.money*.5:c.money)));
    if(!pool.length){news(`${s.name}: לא מצאתי שחקנים שמתאימים להנחיות ב${REGIONS[s.region].name}.`);continue}
    pool.forEach(x=>x.score=x.p.ovr+(x.p.age<=22?(x.p.pot-x.p.ovr)*.5:0)-Math.log2(Math.max(1,marketValue(x.p)/1e6))*2.2+rnd(-2,2));
    pool.sort((a,b)=>b.score-a.score);const depth=s.q>=5?4:s.q>=4?7:s.q>=3?12:20;const picks=shuffle(pool.slice(0,depth)).slice(0,3);
    for(const {p,cl} of picks){p.kn=Math.max(p.kn||0,s.q>=3?2:1);if(s.q<3)p.est=p.ovr+ri(-3,3);
      const verdict=p.ovr>=effOvrTop(c,p.pos)?'יכול להיכנס להרכב מיד':p.pot-p.ovr>=8?'פרויקט לעתיד עם תקרה גבוהה':'תוספת עומק סבירה';
      const trait=pick(p.pos==='GK'?['רפלקסים מצוינים','שולט ברחבה','טוב ברגליים']:p.pos==='DF'?['חזק במשחק האווירי','מהיר להפליא','קורא משחק יפה','קשוח בהתמודדויות']:p.pos==='MF'?['מסירה ארוכה מדויקת','מנוע שלא נגמר','רואה את המשחק','בעיטה מרחוק']:['סיומת קרה','תזוזה בלי כדור','מהיר ברגליים','חזק בגב לשער']);
      const warn=pick(['','',' צריך להתאקלם בחו"ל.',' הסוכן שלו ידוע כקשה.',' היסטוריית פציעות קלה.']);
      p.rep={by:s.name,q:s.q,wk:G.wk,s:G.season,txt:`${trait}. ${verdict}.${warn}`};
      G.reports=G.reports||[];G.reports.unshift({pid:p.id,club:cl.id,by:s.name,wk:G.wk,s:G.season});}
    G.reports=(G.reports||[]).slice(0,40);s.reports+=picks.length;
    news(`דוח סקאוטינג מ${s.name} (${REGIONS[s.region].name}): ${picks.map(x=>fullName(x.p)).join(', ')}.`);
  }
}
function effOvrTop(c,pos){const ps=c.players.filter(p=>p.pos===pos).sort(byOvr);const n=pos==='GK'?1:pos==='FW'?2:3;const slot=ps[n-1]||ps[ps.length-1];return slot?slot.ovr:55}
function quickScout(pid){const c=me();if(!(G.scouts||[]).length)return toast('צריך לפחות סקאוט אחד במערך');const f=findWorldPlayer(pid);if(!f)return;const cost=180000;if(c.money<cost)return toast('אין מספיק תקציב');
  c.money-=cost;addLog(`בדיקת סקאוט: ${fullName(f.p)}`,-cost);f.p.kn=2;const best=G.scouts.slice().sort((a,b)=>b.q-a.q)[0];f.p.rep=f.p.rep||{by:best.name,q:best.q,wk:G.wk,s:G.season,txt:'נבדק לבקשת המנג\'ר. '+pick(['שחקן אמין.','יש פוטנציאל.','מתאים לליגה הישראלית.','ייקח זמן להתאקלם.'])};
  toast('הדוח הגיע');closeModal();render();playerModalAny(pid)}

/* ---- negotiation ---- */
const ROLE_HE={starter:'שחקן הרכב',rotation:'רוטציה',prospect:'עתודה / פרויקט'};
function sellerClub(pid){const f=findWorldPlayer(pid);if(f)return f;for(const c of [...G.clubs,...G.leumit]){if(c.id===G.me)continue;const p=c.players.find(x=>x.id===pid);if(p&&!p.loanOut)return {p,c:c}}return null}
function askingFor(p,sc){const c=sc;let ask=marketValue(p)*1.15;
  const top=c.players.slice().sort(byOvr).slice(0,c.world?3:11).map(x=>x.id);const key=top.includes(p.id)||p.key;if(key)ask*=c.world&&c.tier===1?1.9:1.45;
  // a core player the club does not want to sell (p.nfs) only moves for an offer that makes it worth their while
  if(p.nfs)ask*=c.tier===1?2.4:1.9;
  if(p.contract<=1)ask*=.7;if(p.age>=32)ask*=.8;if(p.age<=21&&p.pot-p.ovr>=8)ask*=1.25;
  if(c.needCash==null)c.needCash=Math.random()<.3;if(c.needCash)ask*=.85;
  return {ask:Math.round(ask/5e4)*5e4,key};
}
function offerEffective(o){return o.fee*(o.inst===1?1:o.inst===2?.95:.9)*(1+(o.sellon||0)/200)}
function startNegotiation(pid){const c=me();if(!WINDOW(G.wk))return toast('חלון ההעברות סגור');const f=sellerClub(pid);if(!f)return;
  if(c.players.length>=30)return toast('הסגל מלא (30)');
  G.negs=G.negs||[];let n=G.negs.find(x=>x.pid===pid&&x.stage!=='dead'&&x.stage!=='done');
  if(!n){const {ask,key}=askingFor(f.p,f.c);n={id:uid++,pid,club:f.c.id,stage:'club',rounds:0,prounds:0,ask,key,nfs:!!f.p.nfs,patience:f.p.nfs?2:3,log:f.p.nfs?[`${f.c.short}: "${fullName(f.p)} לא למכירה. אם תרצו לשכנע אותנו, תצטרכו הצעה חריגה."`]:[],wk:G.wk,s:G.season,offer:{fee:Math.round(marketValue(f.p)/1e5)*1e5,inst:1,sellon:0},pofffer:null};G.negs.unshift(n)}
  closeModal();negModal(n.id)}
function negById(id){return (G.negs||[]).find(x=>x.id===id)}
function submitClubOffer(nid,fee,inst,sellon){
  const n=negById(nid);if(!n||n.stage!=='club')return;if(n.loanRequest)return submitLoanOffer(nid,fee);const c=me();const f=sellerClub(n.pid);if(!f){n.stage='dead';n.log.push('השחקן כבר לא זמין');return}
  const {p,c:sc}=f;fee=Math.max(0,Math.round(fee/5e4)*5e4);n.offer={fee,inst,sellon};n.rounds++;
  const upfront=inst===1?fee:Math.round(fee/inst);if(c.money<upfront){n.log.push(`אין לך ${NIS(upfront)} לתשלום הראשון`);n.rounds--;return}
  const eff=offerEffective(n.offer);const ratio=eff/n.ask;const noise=rnd(-.04,.04);const structF=o=>(o.inst===1?1:o.inst===2?.95:.9)*(1+(o.sellon||0)/200);
  const meetsCounter=n.counter&&eff>=n.counter*structF(n.counterStruct||{inst:1,sellon:0})-1;
  if(n.nfs&&!meetsCounter&&eff<n.ask-1){n.patience--;n.log.push(`${sc.short}: "${ratio>=.8?'מתקרבים, אבל אנחנו לא חייבים למכור. '+NIS(n.ask)+' היא הדרישה שלנו.':'הוא לא למכירה. הצעה כזאת לא פותחת דיון.'}"`);}
  else if(n.key&&sc.world&&sc.tier===1&&ratio<1.6&&!n.nfs){n.log.push(`${sc.short}: "הוא לא למכירה בסכום כזה."`);n.patience--;}
  else if(meetsCounter||ratio+noise>=.95){n.stage='player';n.log.push(`${sc.short} קיבלה את ההצעה: ${NIS(fee)}${inst>1?` ב-${inst} תשלומים`:''}${sellon?` + ${sellon}% ממכירה עתידית`:''}.`);n.pdemand=playerDemand(p,c,sc);n.poffer={wage:n.pdemand.wage,years:n.pdemand.years,role:n.pdemand.role,bonus:n.pdemand.bonus};n.ppatience=2;
    if(Math.random()<.12&&!n.rival){n.rival=true;n.log.push('שמועה: עוד מועדון התעניין, השחקן ידרוש יותר.')}}
  else if(ratio>=.62){const concession=Math.min(.12,.04*n.rounds);const counter=Math.ceil(n.ask*(1-concession)/structF(n.offer)/5e4)*5e4;n.counter=n.rival?Math.max(counter,n.rival.fee):counter;n.counterStruct={inst,sellon};n.patience--;
    if(Math.random()<.1&&!n.rival){n.rival=true;n.ask=Math.round(n.ask*1.15/5e4)*5e4;n.counter=Math.round(n.ask/5e4)*5e4;n.log.push(`מועדון מ${pick(['גרמניה','בלגיה','טורקיה','יוון','קפריסין','הולנד'])} נכנס לתמונה. ${sc.short} מבקשת עכשיו ${NIS(n.counter)}.`)}
    else n.log.push(`${sc.short}: "קרוב, אבל לא. ${NIS(n.counter)}${inst>1?' ב-'+inst+' תשלומים':''}${sellon?' + '+sellon+'% ממכירה':''} וסגרנו."`);}
  else{n.patience--;n.log.push(`${sc.short}: "${pick(['זו לא הצעה רצינית.','אנחנו לא מדברים על סכומים כאלה.','תחזרו כשתהיו רציניים.'])}"`)}
  if(n.patience<=0&&n.stage==='club'){n.stage='dead';n.log.push(`${sc.short} הפסיקה את המשא ומתן לחלון הזה.`)}
  save();
}
function playerDemand(p,c,sc){
  const L=leagueOf(p);const current=playerWage(p)*(p.wmult||1);const base=Math.max(current*1.1,playerWage(p)*1.25);
  const prestigeF=c.prestige<=2?.92:c.prestige<=5?1:1.08;
  const wage=Math.round(base*prestigeF*(p.pers?persWageMult(p):1)/500)*500;
  const role=p.ovr>=effOvrTop(c,p.pos)?'starter':p.age<=22?'prospect':'rotation';
  return {wage,years:p.age<=25?3:p.age<=30?2:1,role,bonus:Math.round(wage*6/1e4)*1e4,current:Math.round(current)};
}
function playerInterest(p,c,o,n){
  const L=leagueOf(p);let s=50;
  s+=c.prestige<=1?22:c.prestige<=4?14:c.prestige<=8?4:-6;
  if(c.euro&&c.euro.stage!=='out')s+=c.euro.comp==='CL'?14:c.euro.comp==='EL'?9:5;
  if(p.age>=30)s+=10;if(p.age<=22&&L&&L.level===3)s-=12;
  if(L){s+=L.level===3?-26:L.level===2?-8:+12}else s+=6;
  if(p.nat==='ישראל')s+=16;if(p.unhappy)s+=10;
  const d=n.pdemand;const wr=o.wage/d.wage;const wF=p.pers==='mercenary'?1.3:1;s+=Math.round((wr-1)*(wr>=1?70:110)*wF);
  if(p.pers==='ambitious'){s+=(c.prestige<=3?8:-8)+((c.euro&&c.euro.stage!=='out')?6:-4)}if(p.pers==='loyal'&&L)s-=8;if(p.pers==='mercenary')s-=Math.round((c.prestige<=3?0:4));
  if(o.years>=d.years)s+=4;else s-=6;
  const roleRank={starter:3,rotation:2,prospect:1};s+=(roleRank[o.role]-roleRank[d.role])*8;
  if(o.bonus>=d.bonus)s+=3;
  if(n.rival)s-=6;
  return clamp(Math.round(s),0,100);
}
function submitPlayerOffer(nid,wage,years,role,bonus){
  const n=negById(nid);if(!n||n.stage!=='player')return;const c=me();const f=sellerClub(n.pid);if(!f){n.stage='dead';n.log.push('השחקן כבר לא זמין');return}
  const {p,c:sc}=f;if(n.loan)years=1;wage=Math.max(5000,Math.round(wage/500)*500);n.poffer={wage,years,role,bonus};n.prounds++;
  const interest=playerInterest(p,c,n.poffer,n);n.interest=interest;
  if(c.money<n.offer.fee/(n.offer.inst||1)+bonus){n.log.push('אין מספיק כסף לתשלום הראשון ולבונוס החתימה');n.prounds--;return}
  if(interest>=62){n.stage='review';n.log.push(`${fullName(p)} מסכים לתנאים. נשאר לאשר את הסיכום.`);save();return}
  if(interest>=42){n.ppatience--;const d=n.pdemand;const want=Math.round(Math.max(d.wage,wage*1.12)/500)*500;n.pcounter=want;n.log.push(`${fullName(p)}: "${pick(['אני רוצה לבוא, אבל התנאים לא מספיקים.','הסוכן שלי אומר שמגיע לי יותר.','תנו לי '+NIS(want)+' לשבוע ואני חותם.'])}"`)}
  else{n.ppatience--;n.log.push(`${fullName(p)}: "${pick(['זה לא הצעד הנכון בשבילי עכשיו.','אני מחפש משהו אחר.','תודה, אבל לא.'])}"`)}
  if(n.ppatience<=0&&n.stage==='player'){n.stage='dead';n.log.push(`${fullName(p)} סגר את הדלת לחלון הזה.`)}
  save();
}
function completeTransfer(n,p,sc){
  const c=me();const o=n.offer,po=n.poffer;const upfront=o.inst===1?o.fee:Math.round(o.fee/o.inst);
  const agentFee=Math.round(o.fee*.05/1e4)*1e4;c.money-=upfront+po.bonus+agentFee;addLog(n.loan?`דמי השאלה ${fullName(p)}`:`רכישת ${fullName(p)}${o.inst>1?' (תשלום 1/'+o.inst+')':''}`,-upfront);if(agentFee)addLog(`עמלת סוכן (5%) על ${fullName(p)}`,-agentFee);if(po.bonus)addLog(`בונוס חתימה ${fullName(p)}`,-po.bonus);
  for(let i=1;i<o.inst;i++){G.payables=G.payables||[];const W=G.season*G.cal.length+G.wk+23*i;G.payables.push({label:`תשלום ${i+1}/${o.inst} על ${fullName(p)} ל${sc.short}`,amount:Math.round(o.fee/o.inst),s:Math.floor(W/G.cal.length),wk:W%G.cal.length})}
  if(sc.league)sc.money+=o.fee;
  sc.players=sc.players.filter(x=>x!==p);
  p.contract=n.loan?1:po.years;p.wage=po.wage;p.role=po.role;p.form=0;p.morale=74;p.fit=95;p.kn=2;p.fromLeague=p.lg?WORLD_LEAGUES[p.lg].name:null;if(n.loan)p.loan={from:sc.id,fromName:sc.short,until:G.season,buy:n.loan.buy};delete p.lg;delete p.vmult;delete p.wmult;delete p.key;delete p.est;p.sellon=o.sellon?{pct:o.sellon,to:sc.short}:null;p.boughtFor=o.fee;finalize(p);c.players.push(p);
  n.stage='done';n.log.push(n.loan?`${fullName(p)} הגיע בהשאלה לעונה! ${NIS(po.wage)} לשבוע.`:`${fullName(p)} חתם! ${po.years} שנים, ${NIS(po.wage)} לשבוע.`);
  news(n.loan?`${fullName(p)} הגיע בהשאלה מ${sc.short} (אופציית רכישה ${NIS(n.loan.buy)}).`:`${fullName(p)} הצטרף מ${sc.short} תמורת ${NIS(o.fee)}.`);if(!n.loan)signingStory(p,c,sc,o.fee);else paperMajor('העברות',`${fullName(p)} בהשאלה ל${c.name}`,`מ${sc.short}, לעונה אחת${n.loan.buy?', עם אופציית רכישה':''}`,`${c.name} סגרה השאלה של ${fullName(p)} (${POSHE[p.pos]}, ${p.age}). ${n.loan.buy?pick(['המנג\'ר מאמין שהוא ייכנס להרכב מיד.','אופציית הרכישה: '+NIS(n.loan.buy)+'.']):'המנג\'ר מאמין שהוא ייכנס להרכב מיד.'}`,c.id,{type:'loan',player:fullName(p),pos:p.pos,age:p.age,no:p.no||null,club:c.name,clubId:c.id,parent:sc.short,until:seasonLabel(),buy:n.loan.buy||null});
  if(po.role==='starter'&&p.ovr<effOvrTop(c,p.pos)-2)p.promised=true;
  autoLineups();save();recordSigning(p,c,n.loan?'loan':'perm',n.loan?{from:sc.short,buy:n.loan.buy}:{from:sc.short,fee:o.fee,inst:o.inst});
}
function processNegotiationsWeekly(){
  if(!G.negs)return;const open=WINDOW(G.wk);
  for(const n of G.negs){if(n.stage==='club'||n.stage==='player'){if(!open){n.stage='dead';n.log.push('החלון נסגר, העסקה נפלה.');const f=sellerClub(n.pid);if(f)news(`חלון ההעברות נסגר: המשא ומתן על ${fullName(f.p)} נפל.`)}else if(Math.random()<.08){const f=sellerClub(n.pid);if(f&&f.c.world&&n.stage==='club'){const others=worldClubs().filter(x=>x!==f.c&&x.lg===f.c.lg);const to=others.length?pick(others):null;if(to){f.c.players=f.c.players.filter(x=>x!==f.p);to.players.push(f.p)}n.stage='dead';n.log.push(`${fullName(f.p)} חתם ב${to?to.short:'מועדון אחר'}.`);news(`${fullName(f.p)} חתם ב${to?to.short:'מועדון אחר'}, המשא ומתן הסתיים.`)}}}}
  G.negs=G.negs.filter(n=>!(n.stage==='dead'||n.stage==='done')||G.wk-n.wk<6||n.s!==G.season);
  // broken promises
  const c=me();for(const p of c.players){if(p.promised&&p.apps>=6&&!c.lineup.includes(p.id)&&Math.random()<.25){p.morale=clamp(p.morale-4,10,100);if(p.morale<40){news(`${fullName(p)} מזכיר שהובטח לו מקום בהרכב.`)}}}
}
function payablesWeekly(){if(!G.payables||!G.payables.length)return;const c=me();const due=G.payables.filter(x=>x.s<G.season||(x.s===G.season&&x.wk<=G.wk));for(const x of due){c.money-=x.amount;addLog(x.label,-x.amount);news(`שולם: ${x.label} (${NIS(x.amount)}).`)}G.payables=G.payables.filter(x=>!due.includes(x))}

/* ---- offers from abroad for my players ---- */
function foreignBuyerFor(p){const lg=p.ovr>=76?pick(['epl','laliga','bundes','seriea','ligue1']):p.ovr>=72?pick(['portugal','eredivisie','belgium','champ','ligue1']):p.ovr>=68?pick(['belgium','scand','east','segunda','mls','champ']):pick(['balkan','east','scand','mls']);ensureWorldLeague(lg);return pick(G.world[lg].clubs)}

/* ---- UI: market world tab ---- */
let worldLg='champ',worldPos='all',worldClubId=null,worldSort='ovr',mktAge='all';
function viewWorld(){
  const c=me();const open=WINDOW(G.wk);const L=WORLD_LEAGUES[worldLg];ensureWorldLeague(worldLg);const clubs=G.world[worldLg].clubs;
  if(worldClubId&&!clubs.some(cl=>cl.id===worldClubId))worldClubId=null;const club=worldClubId?clubs.find(cl=>cl.id===worldClubId):null;
  const tabs=`<div class="tabs" style="margin-bottom:8px">${Object.keys(WORLD_LEAGUES).map(k=>`<button data-wl="${k}" class="${worldLg===k?'on':''}">${WORLD_LEAGUES[k].flag} ${WORLD_LEAGUES[k].name}</button>`).join('')}</div>`;
  let pool=clubs.flatMap(cl=>cl.players.map(p=>({p,cl,c:cl})));
  if(club)pool=pool.filter(x=>x.cl===club);if(worldPos!=='all')pool=pool.filter(x=>x.p.pos===worldPos);if(mktAge!=='all')pool=pool.filter(x=>mktAge==='young'?x.p.age<=23:x.p.age>=29);
  if(worldAvail!=='all')pool=pool.filter(x=>worldAvail==='nfs'?x.p.nfs:!x.p.nfs);
  if(marketSearch){const q=searchNorm(marketSearch);pool=pool.filter(({p})=>[fullName(p),p.en].some(h=>matchRank(searchNorm(h),q)<9))}
  pool=filterMarketPrices(pool,marketValue);
  const natHTML=natOptionsHTML('worldNatSel',pool,worldNat);
  if(worldNat!=='all')pool=pool.filter(x=>hasNat(x.p,worldNat));
  const ws=worldSort==='price'?'price-asc':worldSort;
  pool.sort((a,b)=>ws==='ovr'?(isKnown(b.p)?b.p.ovr:b.p.est)-(isKnown(a.p)?a.p.ovr:a.p.est):ws==='price-asc'?marketValue(a.p)-marketValue(b.p):ws==='price-desc'?marketValue(b.p)-marketValue(a.p):a.p.age-b.p.age);
  const scoutHere=(G.scouts||[]).some(s=>REGIONS[s.region].leagues.includes(worldLg));
  const sq=club&&club.realSquad?(()=>{const n=club.players.length,nfs=club.players.filter(p=>p.nfs).length;return `<div class="squad-note"><b>${esc(club.name)} · סגל מלא: <bdi>${n}</bdi> שחקנים</b><span><bdi>${n-nfs}</bdi> זמינים לרכישה · <bdi>${nfs}</bdi> בסגל הבכיר ולא למכירה (רק הצעה חריגה תשכנע)</span></div>`})():club?`<div class="squad-note"><b>${esc(club.name)}</b><span class="muted">רשימת העברות (אין למועדון הזה נתוני סגל אמיתיים)</span></div>`:'';
  const chips=activeChips([...(club?[[`מועדון: ${club.name}`,'club']]:[]),...(marketSearch?[[`שם: ${marketSearch}`,'search']]:[]),...(worldPos!=='all'?[[`עמדה: ${POSHE[worldPos]}`,'pos']]:[]),...(mktAge!=='all'?[[mktAge==='young'?'גיל: עד 23':'גיל: 29+','age']]:[]),...(worldAvail!=='all'?[[worldAvail==='buy'?'זמינים לרכישה':'לא למכירה','avail']]:[]),...(worldNat!=='all'?[[`לאום: ${worldNat}`,'nat']]:[]),...(marketPrice!=='all'?[[priceChipLabel(),'price']]:[])]);
  return `<div class="card">${marketTabs('world')}${tabs}
  <div class="row between wrap"><h3 class="sec">${L.flag} ${esc(L.name)}</h3><span class="tag ${scoutHere?'good':''}">${scoutHere?'יש לך סקאוט באזור':'אין סקאוט באזור'}</span></div>
  <div class="muted small" style="margin-top:4px">רמת הליגה ~${L.str} · שווי ×${L.vmult} · שכר ×${L.wmult} לעומת ישראל. במועדונים עם נתוני סגל אמיתיים מוצג הסגל המלא; 11 שחקני המפתח בסגל ואינם למכירה. שחקנים שלא נסקרו מוצגים עם טווח דירוג.</div>
  ${marketSearchHTML()}
  <div class="tabs" style="margin-top:8px"><button data-wc="all" class="${!club?'on':''}">כל המועדונים</button>${clubs.map(cl=>`<button data-wc="${cl.id}" class="${worldClubId===cl.id?'on':''}" style="--c1:${cl.c1}"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${cl.c1};border:1px solid #0006;margin-left:4px"></span>${esc(cl.name)}${cl.realSquad?` <span class="muted tiny"><bdi>${cl.players.length}</bdi></span>`:''}</button>`).join('')}</div>
  ${sq}
  <details class="mfold" data-mfold ${marketFiltersOpen?'open':''}><summary>סינון ומיון <span class="muted tiny">(עמדה, גיל, זמינות, לאום, מחיר)</span></summary>
  <div class="tabs" style="margin-top:6px"><button data-wp="all" class="${worldPos==='all'?'on':''}">הכל</button>${POS.map(p=>`<button data-wp="${p}" class="${worldPos===p?'on':''}">${POSHE[p]}</button>`).join('')}<button data-wa="all" class="${mktAge==='all'?'on':''}">כל גיל</button><button data-wa="young" class="${mktAge==='young'?'on':''}">עד 23</button><button data-wa="old" class="${mktAge==='old'?'on':''}">29+</button></div>
  <div class="tabs" style="margin-top:6px"><span class="muted tiny" style="align-self:center">זמינות:</span><button data-wav="all" class="${worldAvail==='all'?'on':''}">כל הסגל</button><button data-wav="buy" class="${worldAvail==='buy'?'on':''}">זמינים לרכישה</button><button data-wav="nfs" class="${worldAvail==='nfs'?'on':''}">לא למכירה</button></div>
  <div class="mfilters">${natHTML}</div>
  <div class="tabs" style="margin-top:6px"><span class="muted tiny" style="align-self:center">מיון:</span><button data-ws="ovr" class="${ws==='ovr'?'on':''}">דירוג</button><button data-ws="price-asc" class="${ws==='price-asc'?'on':''}">מחיר: נמוך לגבוה</button><button data-ws="price-desc" class="${ws==='price-desc'?'on':''}">מחיר: גבוה לנמוך</button><button data-ws="age" class="${ws==='age'?'on':''}">גיל</button></div>
  ${marketPriceControls(pool.length,150,true)}</details><div class="market-results" role="status" aria-live="polite">${pool.length>150?`מוצגים 150 מתוך ${pool.length} שחקנים בסינון`:`${pool.length} שחקנים בסינון`}</div>${chips}</div>
  <div class="list">${pool.slice(0,150).map(({p,cl})=>worldRow(p,cl,open)).join('')||marketPriceEmpty()}</div>`;
}
function worldRow(p,cl,open,showLeague){
  const n=(G.negs||[]).find(x=>x.pid===p.id&&(x.stage==='club'||x.stage==='player'));
  const btn=n?`<button class="btn sm" data-neg="${n.id}">במו"מ</button>`:`<button class="btn sm sec" data-wview="${p.id}">פרטים</button>`;
  const L=showLeague&&cl.lg?WORLD_LEAGUES[cl.lg]:null;
  const sub=`<span class="it">${kitSVG(cl,'sm')} ${esc(cl.short)}</span>${L?`<span class="it">${L.flag} ${esc(L.name)}</span>`:''}<span class="it">גיל ${p.age}</span>${p.foreign?'':`<span class="it">${esc(p.nat)}</span>`}${p.nat2?`<span class="it">${esc(p.nat2)}</span>`:''}<span class="it">שווי <b class="num">${isKnown(p)?NIS(marketValue(p)):'~'+NIS(marketValue(p))}</b></span>${p.nfs?'<span class="it tag nfs" style="padding:0 6px">בסגל · לא למכירה</span>':''}${!p.real?'<span class="it tag gen" style="padding:0 6px" title="אין נתוני סגל אמיתיים למועדון הזה">שחקן בדוי</span>':''}${p.rep?'<span class="it tag good" style="padding:0 6px">נסקר</span>':''}`;
  return playerRow(p,btn,p.nfs?'nfs':'',sub).replace('data-pid','data-wrow');
}
function marketTabs(cur){const negs=(G.negs||[]).filter(n=>n.stage==='club'||n.stage==='player').length;const reps=(G.reports||[]).filter(r=>r.s===G.season&&G.wk-r.wk<4).length;
  return `<div class="tabs" style="margin-bottom:8px"><button data-mtab="buy" class="${cur==='buy'?'on':''}">ישראל</button><button data-mtab="world" class="${cur==='world'?'on':''}">העולם</button><button data-mtab="scout" class="${cur==='scout'?'on':''}">סקאוטינג${reps?` (${reps})`:''}</button><button data-mtab="negs" class="${cur==='negs'?'on':''}">משא ומתן${negs?` (${negs})`:''}</button><button data-mtab="free" class="${cur==='free'?'on':''}">חופשיים (${(G.freeAgents||[]).length})</button></div>`}
function viewScouting(){
  const c=me();const lvl=c.scouting||1;const scouts=G.scouts||[];if(!G.scoutMarket||!G.scoutMarket.length)refreshScoutMarket();
  const stars=q=>'★'.repeat(q)+'☆'.repeat(5-q);
  return `<div class="card">${marketTabs('scout')}<div class="row between wrap"><h3 class="sec">מערך הסקאוטינג</h3><span class="tag info">רמה ${lvl}/3 · עד ${SCOUT_LEVEL[lvl].max} סקאוטים</span></div>
  <div class="muted small" style="margin-top:4px">סקאוט מוצב באזור ומביא דוח על 3 שחקנים כל 2–3 שבועות לפי ההנחיות שלך. סקאוט חלש (★–★★) טועה בדירוג; סקאוט טוב חושף דירוג מדויק ופוטנציאל.</div>
  ${lvl<3?`<div class="actions" style="margin-top:8px"><button class="btn sec" id="upScout">שדרג מחלקה לרמה ${lvl+1} · ${NIS(SCOUT_LEVEL[lvl+1].cost)}</button></div>`:''}</div>
  ${scouts.length?`<div class="card"><h3 class="sec">הסקאוטים שלך</h3><div class="list" style="margin-top:8px">${scouts.map(s=>`<div class="pl" style="flex-wrap:wrap;gap:8px"><div class="name" style="flex:1 1 160px"><b>${esc(s.name)} <span class="stars">${stars(s.q)}</span></b><small>${esc(s.bio)} · ${NIS(s.wage)}/שבוע · דוח בעוד ${s.timer} ש' · ${s.reports} שחקנים נסקרו</small></div>
    <select data-sregion="${s.id}">${Object.keys(REGIONS).map(r=>`<option value="${r}" ${s.region===r?'selected':''}>${REGIONS[r].name}</option>`).join('')}</select>
    <select data-sbrief="${s.id}:pos"><option value="all" ${s.brief.pos==='all'?'selected':''}>כל עמדה</option>${POS.map(p=>`<option value="${p}" ${s.brief.pos===p?'selected':''}>${POSHE[p]}</option>`).join('')}</select>
    <select data-sbrief="${s.id}:maxAge">${[21,24,27,30,34].map(a=>`<option value="${a}" ${s.brief.maxAge===a?'selected':''}>עד גיל ${a}</option>`).join('')}</select>
    <select data-sbrief="${s.id}:budget"><option value="any" ${s.brief.budget==='any'?'selected':''}>כל מחיר</option><option value="full" ${s.brief.budget==='full'?'selected':''}>בתקציב שלי</option><option value="half" ${s.brief.budget==='half'?'selected':''}>עד חצי תקציב</option></select>
    <button class="btn sm danger" data-sfire="${s.id}">פטר</button></div>`).join('')}</div></div>`:''}
  <div class="card"><div class="row between"><h3 class="sec">סקאוטים זמינים לשכירה</h3><button class="btn sm sec" id="refreshScouts">רענן · ₪50K</button></div><div class="list" style="margin-top:8px">${G.scoutMarket.map(s=>`<div class="pl"><div class="name"><b>${esc(s.name)} <span class="stars">${stars(s.q)}</span></b><small>${esc(s.bio)} · מתמחה ב${REGIONS[s.home].name} · ${NIS(s.wage)}/שבוע</small></div><button class="btn sm" data-shire="${s.id}" ${scouts.length>=SCOUT_LEVEL[lvl].max?'disabled':''}>שכור</button></div>`).join('')}</div></div>
  <div class="card"><h3 class="sec">דוחות אחרונים</h3><div class="list" style="margin-top:8px">${(G.reports||[]).slice(0,15).map(r=>{const f=findWorldPlayer(r.pid);if(!f)return '';const {p,c:cl}=f;return playerRow(p,`<button class="btn sm sec" data-wview="${p.id}">פרטים</button>`,'',`<span class="it">${kitSVG(cl,'sm')} ${esc(cl.short)}</span><span class="it">${esc(p.rep?p.rep.txt:'')}</span><span class="it muted">${esc(r.by)}</span>`).replace('data-pid','data-wrow')}).join('')||'<div class="muted small">עוד אין דוחות. שכור סקאוט והצב אותו באזור.</div>'}</div></div>`;
}
function viewNegs(){
  const negs=(G.negs||[]);const act=negs.filter(n=>n.stage==='club'||n.stage==='player'),past=negs.filter(n=>n.stage==='done'||n.stage==='dead');
  const row=n=>{const f=sellerClub(n.pid)||(()=>{const p=me().players.find(x=>x.id===n.pid);return p?{p,c:me()}:null})();if(!f)return '';const {p,c:sc}=f;const st=n.stage==='club'?'מול המועדון':n.stage==='player'?'מול השחקן':n.stage==='done'?'הושלם':'נפל';
    return playerRow(p,`<button class="btn sm ${n.stage==='done'||n.stage==='dead'?'sec':''}" data-neg="${n.id}">${n.stage==='done'||n.stage==='dead'?'פרטים':'המשך'}</button>`,'',`<span class="it">${esc(sc.short)}</span><span class="it">${st}</span><span class="it">הצעה אחרונה <b class="num">${NIS(n.offer.fee)}</b></span>`).replace('data-pid','data-wrow')};
  return `<div class="card">${marketTabs('negs')}<h3 class="sec">משא ומתן פעיל</h3><div class="muted small" style="margin:4px 0 8px">המועדון עונה מיד, אבל הסבלנות מוגבלת: 3 סבבים מול המועדון, 2 מול השחקן. כשהחלון נסגר כל העסקאות הפתוחות נופלות.</div><div class="list">${act.map(row).join('')||'<div class="muted small">אין משא ומתן פתוח. פתח שחקן בלשונית "העולם" או "ישראל" ולחץ "הגש הצעה".</div>'}</div></div>
  ${past.length?`<div class="card"><h3 class="sec">הסתיימו</h3><div class="list" style="margin-top:8px">${past.slice(0,10).map(row).join('')}</div></div>`:''}
  ${(G.payables||[]).length?`<div class="card"><h3 class="sec">תשלומים עתידיים</h3>${G.payables.map(x=>`<div class="fx"><span class="a">${esc(x.label)}</span><span class="s num">${NIS(x.amount)}</span><span class="h muted tiny">עונה ${x.s} שבוע ${x.wk+1}</span></div>`).join('')}</div>`:''}`;
}
function playerModalAny(pid){
  const mine=me().players.find(x=>x.id===pid);if(mine)return playerModal(pid);
  const f=sellerClub(pid);if(!f)return;const {p,c:sc}=f;const c=me();const known=isKnown(p);const L=leagueOf(p);const open=WINDOW(G.wk);
  const n=(G.negs||[]).find(x=>x.pid===pid&&(x.stage==='club'||x.stage==='player'));
  const [lo,hi]=knownRange(p);
  openModal(`<div class="pc-big">${playerCardSVG(p,sc,{big:true,full:true,k:'w',hidden:!known})}</div>${portraitCreditHTML(p)}<div style="text-align:center;margin-top:6px"><h3>${esc(fullName(p))}</h3><div class="muted small">${POSHE[p.pos]} · גיל ${p.age} · ${esc(p.nat)}${p.nat==='ישראל'?' <span class="tag good">ישראלי, לא נספר כזר</span>':''}</div><div class="small">${kitSVG(sc,'sm')} ${esc(sc.name)}${L?` · ${L.flag} ${esc(L.name)}`:''}</div>${known&&p.pers?`<div class="small" style="margin-top:4px">${PERS[p.pers].icon} ${PERS[p.pers].he}</div>`:''}</div>
  ${known?attrBars(p,false)+dossierHTML(p,sc,false):`${attrBars(p,true)}<div class="small muted" style="text-align:center;margin-top:4px">דירוג משוער ${p.kn===1?'~'+p.est:lo+'–'+hi}. ${p.kn===1?'הסקאוט לא בטוח במספר המדויק.':'שלח סקאוט כדי לראות דירוג, פוטנציאל ומאפיינים.'}</div>`}
  <dl class="kv" style="margin-top:10px">${known?`<dt>פוטנציאל</dt><dd class="num">${p.pot}</dd>`:''}<dt>שווי שוק</dt><dd class="num">${known?NIS(marketValue(p)):'~'+NIS(marketValue(p))}</dd><dt>שכר נוכחי</dt><dd class="num">${NIS(Math.round(playerWage(p)*(p.wmult||1)))}/שבוע</dd><dt>חוזה</dt><dd>עד ${contractYear(p)}</dd>${p.key?'<dt>מעמד</dt><dd>שחקן מפתח במועדון</dd>':''}</dl>
  ${p.rep?`<div class="small" style="margin-top:10px;padding:8px 10px;border-radius:8px;background:var(--bg2)"><b>דוח סקאוט (${esc(p.rep.by)}):</b> ${esc(p.rep.txt)}</div>`:''}
  ${p.nfs?`<div class="small nfs-note" style="margin-top:10px">${esc(sc.name)}: ${esc(fullName(p))} בסגל הבכיר של המועדון ואינו עומד למכירה. הצעה חריגה (בערך פי ${sc.tier===1?'2.5':'2'} משווי השוק, בלי מיקוח) עשויה לשכנע.</div>`:''}<div class="actions" style="margin-top:12px">${n?`<button class="btn" data-neg="${n.id}">למשא ומתן</button>`:`<button class="btn" data-startneg="${p.id}" ${open&&c.players.length<30?'':'disabled'}>${open?(p.nfs?'הגש הצעה חריגה':'הגש הצעה'):'החלון סגור'}</button>`}${!known&&p.lg?`<button class="btn sec" data-qscout="${p.id}">בדיקת סקאוט · ₪180K</button>`:''}<button class="btn sec" data-close>סגור</button></div>`);
}
function negModal(nid){
  const n=negById(nid);if(!n)return;if(n.stage==='club'&&n.loanAsked&&!n.loan&&!n.loanRequest)requestLoan(nid);const c=me();const f=sellerClub(n.pid)||(()=>{const p=c.players.find(x=>x.id===n.pid);return p?{p,c:c}:null})();if(!f)return;const {p,c:sc}=f;
  const d=openModal('',e=>{
    const t=e.target;
    if(t.closest('[data-step]')){const [field,delta]=t.closest('[data-step]').dataset.step.split(':');const inp=d.querySelector('#'+field);inp.value=Math.max(0,(+inp.value||0)+(+delta));return}
    if(t.closest('#sendClub')){const fee=+d.querySelector('#fee').value||0;const inst=n.loanRequest?1:+d.querySelector('#inst').value;const sellon=n.loanRequest?0:+d.querySelector('#sellon').value;submitClubOffer(nid,fee,inst,sellon);draw();return}
    if(t.closest('#sendPlayer')){const wage=+d.querySelector('#wage').value||0;const years=+d.querySelector('#years').value;const role=d.querySelector('#role').value;const bonus=+d.querySelector('#bonus').value||0;submitPlayerOffer(nid,wage,years,role,bonus);draw();if(negById(nid).stage==='done'){setTimeout(()=>{closeModal();render()},1200)}return}
    if(t.closest('#useCounter')){d.querySelector('#fee').value=n.loanRequest?n.loanCounter:n.counter;return}
    if(t.closest('#confirmSign')){const nn=negById(nid);const f=sellerClub(nn.pid);if(!f){nn.stage='dead';draw();return}const o=nn.offer,po=nn.poffer;const up=(o.inst===1?o.fee:Math.round(o.fee/o.inst))+Math.round(o.fee*.05/1e4)*1e4+po.bonus;if(me().money<up){toast('אין מספיק כסף לתשלום הראשון');return}const over=wageBill(me())+po.wage>ensureWageCap();completeTransfer(nn,f.p,f.c);if(over){G.board.conf=clamp(G.board.conf-3,0,100);news('ההנהלה לא מרוצה: חתמת מעבר לתקציב השכר שאושר.')}draw();setTimeout(()=>{closeModal();render()},1200);return}
    if(t.closest('#backSign')){const nn=negById(nid);nn.stage='player';draw();return}
    if(t.closest('#askLoan')){requestLoan(nid);draw();return}
    if(t.closest('#switchPurchase')){n.loanRequest=false;n.loanAsked=false;n.offer={fee:Math.round(marketValue(p)/1e5)*1e5,inst:1,sellon:0};n.log.push('בחרת לעבור למשא ומתן לרכישה קבועה.');save();draw();return}
    if(t.closest('#usePCounter')){d.querySelector('#wage').value=n.pcounter;return}
  });d.dataset.lock='1';
  function draw(){
    const nn=negById(nid);const known=isKnown(p);const L=leagueOf(p);
    const head=`<div class="row"><div class="pc-big" style="width:90px;margin:0">${playerCardSVG(p,sc,{k:'n',hidden:!known})}</div><div style="flex:1;min-width:0"><h3>${esc(fullName(p))}</h3><div class="muted small">${POSHE[p.pos]} · ${p.age} · ${esc(sc.name)}${L?` · ${L.flag}`:''}</div><div class="small">שווי ${known?NIS(marketValue(p)):'~'+NIS(marketValue(p))}${nn.key?' · <span class="tag warn">שחקן מפתח</span>':''}${nn.rival?' · <span class="tag bad">יש מתחרים</span>':''}</div><div class="small muted">תקציב: ${NIS(c.money)}</div><span class="tag info">${nn.loanRequest||nn.loan?'השאלה לעונה אחת':'רכישה קבועה'}</span></div></div>`;
    const log=`<div class="neglog">${nn.log.slice(-5).map(l=>`<div>${esc(l)}</div>`).join('')||'<div class="muted">הגש הצעה ראשונה.</div>'}</div>`;
    let body='';
    if(nn.stage==='club'){
      body=`<div class="negstep"><span class="tag info">שלב 1 · המועדון</span><span class="muted tiny">סבלנות: ${'●'.repeat(nn.patience)}${'○'.repeat(3-nn.patience)}</span></div>
      <label class="small">${nn.loanRequest?'דמי השאלה לעונה':'דמי העברה'}<div class="row"><button class="btn sm sec" data-step="fee:-${nn.loanRequest?50000:500000}">−${nn.loanRequest?'50K':'500K'}</button><button class="btn sm sec" data-step="fee:-${nn.loanRequest?10000:100000}">−${nn.loanRequest?'10K':'100K'}</button><input type="number" id="fee" value="${nn.offer.fee}" step="${nn.loanRequest?1000:50000}" min="0" style="flex:1;min-width:90px"><button class="btn sm sec" data-step="fee:${nn.loanRequest?10000:100000}">+${nn.loanRequest?'10K':'100K'}</button><button class="btn sm sec" data-step="fee:${nn.loanRequest?50000:500000}">+${nn.loanRequest?'50K':'500K'}</button></div></label>
      ${nn.loanRequest?'<p class="small muted">דמי השאלה לעונה בלבד. השכר מסוכם בנפרד; אופציית רכישה אינה משולמת עכשיו.</p>':`<div class="row wrap" style="margin-top:8px"><label class="small">מבנה <select id="inst"><option value="1" ${nn.offer.inst===1?'selected':''}>מזומן</option><option value="2" ${nn.offer.inst===2?'selected':''}>2 תשלומים (−5% ערך)</option><option value="3" ${nn.offer.inst===3?'selected':''}>3 תשלומים (−10% ערך)</option></select></label>
      <label class="small">אחוז ממכירה עתידית <select id="sellon"><option value="0" ${!nn.offer.sellon?'selected':''}>0%</option><option value="10" ${nn.offer.sellon===10?'selected':''}>10% (+5% ערך)</option><option value="20" ${nn.offer.sellon===20?'selected':''}>20% (+10% ערך)</option></select></label></div>`}
      ${(nn.loanRequest?nn.loanCounter:nn.counter)?`<div class="small" style="margin-top:6px">הצעה נגדית של המועדון: <b class="num">${NIS(nn.loanRequest?nn.loanCounter:nn.counter)}</b> <button class="btn sm sec" id="useCounter">קבל את הסכום</button></div>`:''}
      <div class="muted tiny" style="margin-top:6px">${nn.loanRequest?`דמי השאלה מבוקשים: ${NIS(nn.loanAsk)} (כ־10% משווי השחקן).`:nn.nfs?`השחקן לא למכירה: המועדון לא יתמקח ויסגור את הדלת אחרי ${nn.patience} סבבים. ${known?'הערכה: רק הצעה מעל '+NIS(nn.ask)+' תשכנע.':'בלי דוח סקאוט קשה להעריך כמה צריך להציע.'}`:known?`הערכה: המועדון מצפה לכ-${NIS(Math.round(nn.ask*.95/1e5)*1e5)}–${NIS(nn.ask)}.`:'בלי דוח סקאוט קשה לדעת כמה הם מצפים.'}</div>
      <div class="actions" style="margin-top:10px"><button class="btn" id="sendClub" ${nn.loanRequest&&nn.loanRefused?'disabled':''}>${nn.loanRequest?'שלח הצעת השאלה':'שלח הצעת רכישה'}</button>${nn.loanRequest?'<button class="btn sec" id="switchPurchase">עבור לרכישה</button>':marketValue(p)<=25e6?`<button class="btn sec" id="askLoan" style="flex:0 0 auto">בקש השאלה</button>`:''}<button class="btn sec" data-close>סגור</button></div>`;
    }else if(nn.stage==='player'){
      const dm=nn.pdemand;const po=nn.poffer;const interest=playerInterest(p,c,po,nn);
      body=`<div class="negstep"><span class="tag info">שלב 2 · השחקן</span><span class="muted tiny">סבלנות: ${'●'.repeat(nn.ppatience)}${'○'.repeat(2-nn.ppatience)}</span></div>
      <div class="small">דרישות הסוכן: <b class="num">${NIS(dm.wage)}</b>/שבוע · ${dm.years} שנים · ${ROLE_HE[dm.role]} · בונוס ${NIS(dm.bonus)}${dm.current?` <span class="muted">(מרוויח היום כ-${NIS(dm.current)})</span>`:''}</div>
      <label class="small" style="display:block;margin-top:8px">שכר לשבוע<div class="row"><button class="btn sm sec" data-step="wage:-5000">−5K</button><input type="number" id="wage" value="${po.wage}" step="500" min="5000" style="flex:1;min-width:90px"><button class="btn sm sec" data-step="wage:5000">+5K</button></div></label>
      <div class="row wrap" style="margin-top:8px"><label class="small">שנים <select id="years">${(nn.loan?[1]:[1,2,3,4,5]).map(y=>`<option value="${y}" ${po.years===y?'selected':''}>${y}</option>`).join('')}</select></label>
      <label class="small">תפקיד מובטח <select id="role">${Object.keys(ROLE_HE).map(r=>`<option value="${r}" ${po.role===r?'selected':''}>${ROLE_HE[r]}</option>`).join('')}</select></label>
      <label class="small">בונוס חתימה <input type="number" id="bonus" value="${po.bonus}" step="10000" min="0" style="width:110px"></label></div>
      ${nn.pcounter?`<div class="small" style="margin-top:6px">השחקן מבקש <b class="num">${NIS(nn.pcounter)}</b>/שבוע <button class="btn sm sec" id="usePCounter">תן לו</button></div>`:''}
      <div class="kv" style="margin-top:8px"><dt>עניין משוער של השחקן</dt><dd class="num">${interest}%</dd></div><div class="bar"><i style="width:${interest}%;background:${interest>=62?'var(--good)':interest>=42?'var(--warn)':'var(--bad)'}"></i></div>
      <div class="muted tiny" style="margin-top:4px">${L&&L.level===3?'שחקן מליגה גדולה ירד לישראל רק תמורת שכר גבוה, יוקרה או אירופה.':L&&L.level===1?'שחקנים מליגות קטנות רואים בישראל קפיצה קדימה.':''}${p.nat==='ישראל'?' ישראלי בחו"ל ישמח לחזור הביתה.':''}</div>
      <div class="actions" style="margin-top:10px"><button class="btn" id="sendPlayer">הצע חוזה</button><button class="btn sec" data-close>סגור</button></div>`;
    }else if(nn.stage==='review'){const o=nn.offer,po=nn.poffer;const cap=ensureWageCap();const bill=wageBill(c);const after=bill+po.wage;const up=o.inst===1?o.fee:Math.round(o.fee/o.inst);const agent=Math.round(o.fee*.05/1e4)*1e4;const total=o.fee+agent+po.bonus+po.wage*46*po.years;
      body=`<div class="negstep"><h3 class="sec">סיכום לפני חתימה</h3><dl class="kv"><dt>${nn.loan?'דמי השאלה לעונה':'דמי העברה'}</dt><dd class="num">${NIS(o.fee)}${o.inst>1?` · ${o.inst} תשלומים (עכשיו ${NIS(up)})`:''}</dd>${nn.loan?`<dt>אופציית רכישה (לא לתשלום עכשיו)</dt><dd class="num">${NIS(nn.loan.buy)}</dd>`:''}${o.sellon?`<dt>סעיף מכירה</dt><dd>${o.sellon}% ל${esc(sc.short)}</dd>`:''}<dt>עמלת סוכן (5%)</dt><dd class="num">${NIS(agent)}</dd><dt>בונוס חתימה</dt><dd class="num">${NIS(po.bonus)}</dd><dt>שכר</dt><dd class="num">${NIS(po.wage)}/שבוע · ${po.years} ${po.years>1?'שנים':'שנה'}</dd><dt>מעמד מובטח</dt><dd>${ROLE_HE[po.role]||po.role}</dd><dt>תשלום עכשיו</dt><dd class="num"><b>${NIS(up+agent+po.bonus)}</b> מתוך ${NIS(c.money)}</dd><dt>עלות כוללת לאורך החוזה</dt><dd class="num">${NIS(total)}</dd><dt>תקציב שכר</dt><dd class="num" style="color:${after>cap?'var(--bad)':'inherit'}">${NIS(after)} / ${NIS(cap)} לשבוע</dd></dl>
      ${after>cap?'<div class="small" style="color:var(--bad);margin-top:6px">העסקה חורגת מתקציב השכר שההנהלה אישרה. אפשר לחתום, אבל האמון יירד ב-3.</div>':''}${o.inst>1?'<div class="muted tiny" style="margin-top:4px">התשלומים הבאים יופיעו בכספים ← תשלומים עתידיים.</div>':''}</div>
      <div class="actions" style="margin-top:10px"><button class="btn" id="confirmSign">אשר וחתום</button><button class="btn sec" id="backSign">חזרה לתנאים</button></div>`;
    }else{
      body=`<div class="negstep"><span class="tag ${nn.stage==='done'?'good':'bad'}">${nn.stage==='done'?'העסקה הושלמה':'המשא ומתן נפל'}</span></div><div class="actions" style="margin-top:10px"><button class="btn sec" data-close>סגור</button></div>`;
    }
    d.querySelector('.card').innerHTML=head+log+body;
  }
  draw();
}

