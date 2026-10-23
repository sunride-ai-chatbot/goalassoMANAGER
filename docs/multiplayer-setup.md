# משחק רשת · הפעלה (Supabase)

הקוד של משחק הרשת כבר בבנייה. כדי שהוא יעבוד באתר צריך פרויקט Supabase (חינמי) ושני ערכים ציבוריים.

## 1. פרויקט
1. היכנס ל-<https://supabase.com> → **New project** (אזור: Frankfurt/EU קרוב לישראל). שמור את סיסמת מסד הנתונים.
2. **Authentication → Providers → Anonymous sign-ins → Enable** (השחקנים נכנסים כאורחים, בלי הרשמה).
3. **SQL Editor → New query**: הדבק את כל התוכן של `supabase/migrations/20261023120000_multiplayer.sql` → **Run**. אמור להסתיים בלי שגיאות (טבלאות `mp_leagues`, `mp_members`, הפונקציות `mp_*`, ו-Realtime).
4. **Database → Replication** (או Realtime): ודא ששתי הטבלאות מסומנות (המיגרציה מוסיפה אותן ל-`supabase_realtime`).

## 2. הערכים הציבוריים
**Project Settings → API**:
- `Project URL` → `SUPABASE_URL`
- המפתח **anon / publishable** → `SUPABASE_PUBLISHABLE_KEY`

**לעולם לא** את `service_role` / secret.

## 3. חיבור לאתר (GitHub Pages)
בריפו: **Settings → Secrets and variables → Actions → New repository secret**:
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

הפריסה הבאה (push ל-`main`, או **Actions → Deploy → Run workflow**) תבנה את הקובץ עם הערכים, וכרטיס "משחק רשת" במסך הפתיחה יראה **זמין**.

## 4. בדיקה מקומית (אופציונלי)
`.env` בשורש הריפו (git-ignored):
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_PUBLISHABLE_KEY=eyJ...
```
`npm run build`. אפשר גם בלי build: בקונסולת הדפדפן
`localStorage.goalasso_supabase=JSON.stringify({url:'https://xxxx.supabase.co',key:'eyJ...'})` ורענון.

## איך משחקים
1. המזמין: מסך פתיחה → "משחק רשת" → שם, מועדון, אורך תור → **צור ליגה וקבל קוד**.
2. שולח לחבר את הקוד או את הקישור (`?join=KOD`). החבר בוחר מועדון פנוי → **הצטרף לליגה**.
3. המזמין לוחץ **התחל ליגה**.
4. כל שבוע: כל אחד מסדר הרכב/טקטיקה ולוחץ **מוכן לשבוע**. כששניהם מוכנים (או כשהטיימר נגמר) הטלפון של המזמין מריץ את השבוע ושני הטלפונים צופים במשחקים שלהם (המשחק ביניהם: אותו שידור).
5. ניתוק: המחשב מנהל במקום מי שלא לחץ "מוכן" עד שהטיימר נגמר; הוא חוזר לנקודה העדכנית כשהוא נכנס שוב.

מגבלות הגרסה הראשונה: בלי העברות, בלי ווקי-טוקי (בתכנון), שני מאמנים בליגה.
