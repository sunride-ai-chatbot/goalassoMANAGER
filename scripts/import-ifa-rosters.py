#!/usr/bin/env python3
"""Registered squads of Liga Alef (north, south) and the youth premier league, from a workbook of the federation's
squad pages (sheet 1: league, team, player name, position, season, player id, team id, …).

    python3 -I scripts/import-ifa-rosters.py --xlsx <workbook.xlsx>

Writes
  data/euro/a_<key>.json           one per Liga Alef club, in the squad format the game already reads (RAW_EURO)
  data/config/youth-squads.json    senior club name → the names registered for its youth side

The source lists names only. For the Liga Alef squads the position and the value are therefore the game's own
(`generated` in each file names the fields): positions are dealt to a squad in a fixed proportion and values spread
inside a narrow band, both from the player's federation id, so a re-import gives the same result. Ages stay empty
(the game draws one). Youth players are stored as names only: no ids, no profile links, no dates. Names the federation
masks (*****) are skipped. The workbook itself is not kept in the repository.
"""
import argparse, collections, hashlib, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# federation team name → (key, name in the game, city, shirt, trim). Shirt colours follow the club family
# (Hapoel red, Maccabi yellow/blue, Beitar yellow/black); they are approximations, not official kits.
RED, WHITE, BLUE, YELLOW, BLACK, GREEN = '#d81e1e', '#ffffff', '#1d4ed8', '#f5d000', '#111111', '#1f8a3a'
ALEF = {
    'עירוני נשר': ('a_nesher', 'עירוני נשר', 'נשר', BLUE, WHITE),
    'מועדון ספורט טירה': ('a_tira', 'מ.ס. טירה', 'טירה', BLUE, WHITE),
    'הפועל עירוני כרמיאל': ('a_karmiel', 'הפועל כרמיאל', 'כרמיאל', RED, WHITE),
    'בית"ר נהריה': ('a_nahariya', 'בית"ר נהריה', 'נהריה', YELLOW, BLACK),
    'הפועל מגדל העמק': ('a_migdal_haemek', 'הפועל מגדל העמק', 'מגדל העמק', RED, WHITE),
    'הפועל נוף הגליל': ('a_nof_hagalil', 'הפועל נוף הגליל', 'נוף הגליל', RED, WHITE),
    'הפועל אום אל פאחם': ('a_umm_al_fahm', 'הפועל אום אל-פחם', 'אום אל-פחם', GREEN, WHITE),
    'הפועל בית שאן מסילות': ('a_beit_shean', 'הפועל בית שאן', 'בית שאן', RED, WHITE),
    'מכבי נווה שאנן אלדד': ('a_neve_shaanan', 'מכבי נווה שאנן', 'חיפה', BLUE, WHITE),
    'מכבי אתא ביאליק': ('a_ata_bialik', 'מכבי אתא ביאליק', 'קריית אתא', YELLOW, BLUE),
    "מכבי נוג'ידאת אחמד": ('a_nujeidat', "מכבי נוג'ידאת", "בועיינה-נוג'ידאת", YELLOW, BLUE),
    "הפועל איחוד בני ג'ת": ('a_jatt', "איחוד בני ג'ת", "ג'ת", RED, WHITE),
    'הפועל עירוני בקה אל גרבייה': ('a_baqa', 'הפועל בקה אל-גרבייה', 'בקה אל-גרבייה', RED, WHITE),
    'הפועל בני מוסמוס': ('a_musmus', 'הפועל בני מוסמוס', 'מוסמוס', RED, WHITE),
    'מועדון כדורגל צעירי טמרה': ('a_tamra', 'צעירי טמרה', 'טמרה', GREEN, WHITE),
    'הפועל טירת כרמל': ('a_tirat_carmel', 'הפועל טירת כרמל', 'טירת כרמל', RED, WHITE),
    'הפועל עירוני עראבה': ('a_arraba', 'הפועל עראבה', 'עראבה', RED, WHITE),
    'צעירי אום אל פאחם': ('a_tzeirei_umm_al_fahm', 'צעירי אום אל-פחם', 'אום אל-פחם', GREEN, WHITE),
    'שמשון פזטל תל אביב': ('a_shimshon', 'שמשון תל אביב', 'תל אביב', BLUE, WHITE),
    'מועדון ספורט דימונה': ('a_dimona', 'מ.ס. דימונה', 'דימונה', BLUE, WHITE),
    'מועדון כדורגל חולון ירמיהו': ('a_holon', 'מ.כ. חולון', 'חולון', BLUE, WHITE),
    'מכבי קרית מלאכי עירוני': ('a_kiryat_malakhi', 'מכבי קריית מלאכי', 'קריית מלאכי', YELLOW, BLUE),
    'מועדון כדורגל שדרות': ('a_sderot', 'מ.כ. שדרות', 'שדרות', RED, WHITE),
    'הפועל ניר רמת השרון': ('a_ramat_hasharon', 'הפועל ניר רמת השרון', 'רמת השרון', RED, WHITE),
    'מכבי יבנה': ('a_yavne', 'מכבי יבנה', 'יבנה', YELLOW, BLUE),
    'הפועל חדרה שולם שוורץ': ('a_hadera', 'הפועל חדרה', 'חדרה', RED, WHITE),
    'מועדון כדורגל מכבי עירוני אשדוד': ('a_ironi_ashdod', 'מכבי עירוני אשדוד', 'אשדוד', BLUE, YELLOW),
    'הפועל אזור': ('a_azor', 'הפועל אזור', 'אזור', RED, WHITE),
    'עירוני בית שמש': ('a_beit_shemesh', 'עירוני בית שמש', 'בית שמש', BLUE, WHITE),
    'מועדון כדורגל ירושלים': ('a_fc_jerusalem', 'מ.כ. ירושלים', 'ירושלים', BLUE, WHITE),
    'הפועל הרצליה עירוני': ('a_hapoel_herzliya', 'הפועל הרצליה', 'הרצליה', RED, WHITE),
    'הפועל מרמורק רחובות חיים': ('a_marmorek', 'הפועל מרמורק', 'רחובות', RED, WHITE),
    'הפועל מחנה יהודה עידן פוקס': ('a_mahane_yehuda', 'הפועל מחנה יהודה', 'פתח תקווה', RED, WHITE),
    'מועדון כדורגל כפר סבא': ('a_fc_kfar_saba', 'מ.כ. כפר סבא', 'כפר סבא', GREEN, WHITE),
    'אגודת ספורט נורדיה ירושלים': ('a_nordia', 'נורדיה ירושלים', 'ירושלים', YELLOW, BLACK),
    'מועדון כדורגל צעירי טירה': ('a_tzeirei_tira', 'צעירי טירה', 'טירה', GREEN, WHITE),
}
# youth side (federation name) → the senior club as the game names it
YOUTH = {
    'מכבי תל אביב שחר': 'מכבי תל אביב', 'מכבי חיפה "הרדי"': 'מכבי חיפה', 'הפועל תל אביב ניסנוב': 'הפועל תל אביב',
    'מכבי פתח-תקוה עסיסי דוד': 'מכבי פתח תקווה', 'מכבי נתניה שלומי': 'מכבי נתניה', 'הפועל פתח תקווה נחום סטלמך': 'הפועל פתח תקווה',
    'הפועל באר שבע השלושה': 'הפועל באר שבע', 'בית"ר ירושלים אורן': 'בית"ר ירושלים', 'הפועל חיפה רובי': 'הפועל חיפה',
    'הפועל ראשון לציון יהודה': 'הפועל ראשון לציון', 'הפועל כפר סבא ישראל': 'הפועל כפר סבא', 'הפועל חדרה': 'הפועל חדרה',
    'הפועל קרית שמונה': 'עירוני קריית שמונה', 'מועדון ספורט אשדוד': 'מ.ס. אשדוד', 'בני יהודה תל אביב "בראל חדריה שמואל"': 'בני יהודה',
    'הפועל ירושלים': 'הפועל ירושלים', 'הפועל רעננה רועי': 'הפועל רעננה', 'מכבי הרצליה י כהנא': 'מכבי הרצליה',
    'הפועל ניר רמת השרון': 'הפועל ניר רמת השרון',
}
LEAGUES = {'ליגה א׳ צפון': 'alef_north', 'ליגה א׳ דרום': 'alef_south', 'ליגת העל לנוער': 'youth'}
MIN_SQUAD = 14          # the game fields a real squad from 14 players up


def h(*parts):
    return int(hashlib.sha256('|'.join(str(p) for p in parts).encode('utf8')).hexdigest()[:12], 16)


def clean(name):
    name = re.sub(r'\s+', ' ', str(name or '')).strip()
    return None if not name or set(name) <= set('*') or len(name.split()) < 2 else name


def positions(n):
    """A playable shape for n players: keepers first, the rest split defence / midfield / attack."""
    gk = 3 if n >= 24 else 2
    rest = n - gk
    df = round(rest * .36); fw = round(rest * .26); mf = rest - df - fw
    return ['GK'] * gk + ['DF'] * df + ['MF'] * mf + ['FW'] * fw


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--xlsx', required=True)
    ap.add_argument('--fetched', default=None, help='date the squads were read (YYYY-MM-DD); default: from the workbook note')
    a = ap.parse_args()
    import openpyxl
    wb = openpyxl.load_workbook(a.xlsx, read_only=True, data_only=True)
    rows = [r for r in wb.worksheets[0].iter_rows(values_only=True)]
    note = ' '.join(str(r[0]) for r in rows[:6] if r and r[0])
    m = re.search(r'(\d{1,2})\.(\d{1,2})\.(\d{4})', note)
    fetched = a.fetched or (f'{m.group(3)}-{int(m.group(2)):02d}-{int(m.group(1)):02d}' if m else None)
    head = next(i for i, r in enumerate(rows) if r and r[0] == 'ליגה')
    teams = collections.OrderedDict()
    masked = dup = 0
    for r in rows[head + 1:]:
        if not r or not r[0]:
            continue
        league, team, name, _pos, season, pid, tid = r[:7]
        if league not in LEAGUES:
            sys.exit(f'unknown league: {league}')
        t = teams.setdefault((LEAGUES[league], team), {'tid': str(tid), 'season': season, 'players': [], 'seen': set()})
        nm = clean(name)
        if not nm:
            masked += 1; continue
        if nm in t['seen']:
            dup += 1; continue
        t['seen'].add(nm); t['players'].append((nm, str(pid)))
    alef_out, youth_out, skipped = [], collections.OrderedDict(), []
    for (lg, team), t in teams.items():
        if lg == 'youth':
            if team not in YOUTH:
                sys.exit(f'youth side without a senior club: {team}')
            youth_out[YOUTH[team]] = {'team': team, 'ifa_team': t['tid'], 'players': sorted(n for n, _ in t['players'])}
            continue
        if team not in ALEF:
            sys.exit(f'Liga Alef club without a key: {team}')
        key, name_he, city, c1, c2 = ALEF[team]
        if len(t['players']) < MIN_SQUAD:
            skipped.append(f'{name_he} ({len(t["players"])})'); continue
        order = sorted(t['players'], key=lambda x: h('pos', x[1]))          # who gets which position: by id, not by alphabet
        pos = dict(zip((pid for _, pid in order), positions(len(order))))
        players = [{'he': n, 'en': n, 'pos': pos[pid], 'age': None, 'nat': 'Israel',
                    'value_m': round(.045 + (h('val', pid) % 1000) / 1000 * .105, 3)} for n, pid in t['players']]
        alef_out.append({'key': key, 'name_he': name_he, 'league': lg, 'city': city, 'c1': c1, 'c2': c2,
                         'source': f'football.org.il team_id={t["tid"]} season {t["season"]}: {team}', 'fetched': fetched,
                         'generated': ['pos', 'value_m'], 'players': players})
    for d in alef_out:
        with open(os.path.join(ROOT, 'data', 'euro', d['key'] + '.json'), 'w', encoding='utf8') as fh:
            json.dump(d, fh, ensure_ascii=False, indent=1); fh.write('\n')
    with open(os.path.join(ROOT, 'data', 'config', 'youth-squads.json'), 'w', encoding='utf8') as fh:
        json.dump({'_comment': 'Senior club (name in the game) → the squad registered for its youth side in the youth premier league. '
                               'Names only; position, age and ability of an academy prospect are the game\'s. Written by scripts/import-ifa-rosters.py.',
                   'source': 'football.org.il squad pages', 'fetched': fetched, 'clubs': youth_out}, fh, ensure_ascii=False, indent=1); fh.write('\n')
    print(f'Liga Alef: {len(alef_out)} clubs, {sum(len(d["players"]) for d in alef_out)} players'
          + (f'; too small to field: {", ".join(skipped)}' if skipped else ''))
    print(f'youth: {len(youth_out)} clubs, {sum(len(v["players"]) for v in youth_out.values())} names')
    print(f'masked or one-word names skipped: {masked}; repeated names inside one squad: {dup}')


if __name__ == '__main__':
    main()
