import pathlib
import re
import unittest
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).parents[1]
HTML = (ROOT / "resource_planner.html").read_text()
SQL = (ROOT / "supabase/migrations/20260913000000_planner_cloud.sql").read_text()


class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()

    def handle_starttag(self, _tag, attrs):
        values = dict(attrs)
        if values.get("id"):
            self.ids.add(values["id"])


class StaticContractTests(unittest.TestCase):
    def test_cloud_controls_exist(self):
        parser = Parser()
        parser.feed(HTML)
        required = {"btnSignIn", "cloudWeeks", "btnCloudSave", "btnPublish", "btnGmail", "btnRetry"}
        self.assertTrue(required <= parser.ids)

    def test_person_email_is_persisted(self):
        self.assertIn('data-f="email"', HTML)
        self.assertIn("email:String(p.email||'').trim().toLowerCase()", HTML)

    def test_offline_fallback_remains(self):
        self.assertIn("state=restore()||sampleState()", HTML)
        self.assertIn("localStorage.setItem(LS_KEY", HTML)
        self.assertIn("function saveJSON()", HTML)
        self.assertIn("function exportCSV()", HTML)

    def test_calendar_pdf_export_and_user_filter_exist(self):
        parser = Parser()
        parser.feed(HTML)
        self.assertTrue({"btnPDF", "userFilter"} <= parser.ids)
        self.assertIn("function exportPDF()", HTML)
        self.assertIn("window.print()", HTML)
        self.assertIn("header,aside,#statusCard{display:none!important}", HTML)
        self.assertNotIn("header,aside,#statusCard,#tableCard{display:none!important}", HTML)
        self.assertIn("function visiblePeople()", HTML)
        self.assertIn("function personLegendHTML()", HTML)
        self.assertIn('class="person-legend"', HTML)
        self.assertGreaterEqual(HTML.count("visiblePeople().forEach"), 2)

    def test_dragging_shows_exact_time_preview(self):
        self.assertIn("function dragStartAt(t,e)", HTML)
        self.assertIn("function showDropPreview(t,start)", HTML)
        self.assertIn("preview.className='drop-preview'", HTML)
        self.assertIn("preview.textContent=hh(start)+'–'+hh(start+dragSrc.len)", HTML)
        self.assertIn("const newStart=dragStartAt(t,e)", HTML)

    def test_resize_hinges_do_not_trigger_shift_move(self):
        self.assertIn("if(e.target.closest('.rz')){e.preventDefault();return;}", HTML)

    def test_recipient_mode_is_read_only(self):
        self.assertIn(".from('week_assignments').select", HTML)
        self.assertIn("header>.viewtools", HTML)
        self.assertNotRegex(HTML, r"assignmentId[\s\S]{0,500}\.update\(")

    def test_rls_and_grants(self):
        self.assertIn("alter table public.weeks enable row level security", SQL)
        self.assertIn("alter table public.week_assignments enable row level security", SQL)
        self.assertIn("recipient_email = lower(coalesce((select auth.jwt() ->> 'email'), ''))", SQL)
        self.assertIn("revoke all on public.weeks, public.week_assignments from anon", SQL)
        self.assertNotIn("grant select on public.weeks to anon", SQL)

    def test_private_credentials_are_not_granted_to_clients(self):
        self.assertIn("revoke all on schema private from public, anon, authenticated", SQL)
        for function in re.findall(r"create or replace function public\.(service_[^(]+)", SQL):
            self.assertIn(f"revoke all on function public.{function}", SQL)
            self.assertIn("to service_role", SQL)


if __name__ == "__main__":
    unittest.main()
