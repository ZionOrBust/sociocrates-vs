import React, { useEffect, useState } from 'react';
import { useApi, useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/accordion';
import { useToast } from '../components/ui/toaster';

const DEFAULTS = {
  timing: { clarifyingQuestions: '3d', quickReactions: '2d', objectionRound: '5d', resolveObjections: '7d', consentRound: '3d' },
  autoAdvance: { enabled: true, requireAllQuestionsAnswered: true, requireNoOpenObjections: true },
  quorum: { privatePercent: 60, assemblyPercent: 70 },
  eligibility: { lockAtStageOpen: true },
  notify: { channels: { email: true, sms: false }, reminders: { enabled: true, offsets: ['-24h','-2h'] }, admin: { onAutoAdvanceFailure: true, email: '' } },
  privacy: { objections: { voterNames: 'Public' }, observers: { anonymized: true } },
  consent: { allowReservationNote: true },
  objection: { requireHarmStatement: true, requireStrengthScale: true, allowShares: true },
  resolution: { editors: 'Proposer + Facilitator', requirePatchNote: true, objectorAckRequired: true },
  overrides: { allowPerProposalTimers: false, allowManualAdvanceByFacilitator: true },
  handoff: { finalAuthority: 'Board', email: '', cellphone: '', autoSendFinalReport: true },
  report: { includeFinalText: true, includeParticipationStats: true },
  assembly: { nominations: { enabled: true, threshold: 'Majority' } },
};

export default function AdminSettings() {
  const { user } = useAuth();
  const { apiCall } = useApi();
  const { toast } = useToast();
  const [org, setOrg] = useState<{ id: string; name: string } | null>(null);
  const [orgName, setOrgName] = useState('');
  const [settings, setSettings] = useState<any>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiCall('/orgs/me');
        if (data.org) {
          setOrg(data.org);
          setOrgName(data.org.name);
          setSettings(data.settings || DEFAULTS);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      if (!org) {
        const created = await apiCall('/orgs/init', { method: 'POST', body: JSON.stringify({ name: orgName || `${user?.name}'s Organization`, settings }) });
        setOrg(created.org);
        toast({ title: 'Organization initialized', description: 'Settings saved.' });
      } else {
        await apiCall(`/orgs/${org.id}/settings`, { method: 'PUT', body: JSON.stringify({ settings }) });
        toast({ title: 'Settings saved', description: 'Your changes have been saved.' });
      }
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-[300px] flex items-center justify-center">Loading settings…</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization Settings</CardTitle>
          <CardDescription>Configure how your organization uses Sociocracy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!org && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
              <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Your organization name" />
            </div>
          )}

          <Accordion type="multiple" defaultValue={["timing","participation","notifications","privacy","consent","facilitation","overrides","handoff","reports","assembly"]}>
            <AccordionItem value="timing">
              <AccordionTrigger>Timing & Auto-Progress</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Clarifying Questions (e.g., 3d)">
                    <Input value={settings.timing.clarifyingQuestions} onChange={(e) => setSettings({ ...settings, timing: { ...settings.timing, clarifyingQuestions: e.target.value } })} />
                  </Field>
                  <Field label="Quick Reactions (e.g., 2d)">
                    <Input value={settings.timing.quickReactions} onChange={(e) => setSettings({ ...settings, timing: { ...settings.timing, quickReactions: e.target.value } })} />
                  </Field>
                  <Field label="Objection Round (e.g., 5d)">
                    <Input value={settings.timing.objectionRound} onChange={(e) => setSettings({ ...settings, timing: { ...settings.timing, objectionRound: e.target.value } })} />
                  </Field>
                  <Field label="Resolve Objections (e.g., 7d)">
                    <Input value={settings.timing.resolveObjections} onChange={(e) => setSettings({ ...settings, timing: { ...settings.timing, resolveObjections: e.target.value } })} />
                  </Field>
                  <Field label="Consent Round (e.g., 3d)">
                    <Input value={settings.timing.consentRound} onChange={(e) => setSettings({ ...settings, timing: { ...settings.timing, consentRound: e.target.value } })} />
                  </Field>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Toggle label="Auto-Advance" checked={settings.autoAdvance.enabled} onChange={(v) => setSettings({ ...settings, autoAdvance: { ...settings.autoAdvance, enabled: v } })} />
                  <Toggle label="Require All Questions Answered" checked={settings.autoAdvance.requireAllQuestionsAnswered} onChange={(v) => setSettings({ ...settings, autoAdvance: { ...settings.autoAdvance, requireAllQuestionsAnswered: v } })} />
                  <Toggle label="Require No Open Objections" checked={settings.autoAdvance.requireNoOpenObjections} onChange={(v) => setSettings({ ...settings, autoAdvance: { ...settings.autoAdvance, requireNoOpenObjections: v } })} />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="participation">
              <AccordionTrigger>Participation & Quorum</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Quorum (Private %) ">
                    <Input type="number" value={settings.quorum.privatePercent} onChange={(e) => setSettings({ ...settings, quorum: { ...settings.quorum, privatePercent: Number(e.target.value) } })} />
                  </Field>
                  <Field label="Quorum (Assembly %) ">
                    <Input type="number" value={settings.quorum.assemblyPercent} onChange={(e) => setSettings({ ...settings, quorum: { ...settings.quorum, assemblyPercent: Number(e.target.value) } })} />
                  </Field>
                </div>
                <div className="mt-4">
                  <Toggle label="Eligibility fixed when stage opens" checked={settings.eligibility.lockAtStageOpen} onChange={(v) => setSettings({ ...settings, eligibility: { lockAtStageOpen: v } })} />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="notifications">
              <AccordionTrigger>Notifications & Reminders</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Toggle label="Email" checked={settings.notify.channels.email} onChange={(v) => setSettings({ ...settings, notify: { ...settings.notify, channels: { ...settings.notify.channels, email: v } } })} />
                  <Toggle label="SMS" checked={settings.notify.channels.sms} onChange={(v) => setSettings({ ...settings, notify: { ...settings.notify, channels: { ...settings.notify.channels, sms: v } } })} />
                  <Toggle label="Reminders Enabled" checked={settings.notify.reminders.enabled} onChange={(v) => setSettings({ ...settings, notify: { ...settings.notify, reminders: { ...settings.notify.reminders, enabled: v } } })} />
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Reminder Offsets (comma-separated)">
                    <Input value={settings.notify.reminders.offsets.join(',')} onChange={(e) => setSettings({ ...settings, notify: { ...settings.notify, reminders: { ...settings.notify.reminders, offsets: e.target.value.split(',').map((s) => s.trim()) } } })} />
                  </Field>
                  <Field label="Admin Alert Email">
                    <Input type="email" value={settings.notify.admin.email} onChange={(e) => setSettings({ ...settings, notify: { ...settings.notify, admin: { ...settings.notify.admin, email: e.target.value } } })} />
                  </Field>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="privacy">
              <AccordionTrigger>Privacy & Visibility</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Objection Voter Names">
                    <select className="border rounded-md p-2" value={settings.privacy.objections.voterNames} onChange={(e) => setSettings({ ...settings, privacy: { ...settings.privacy, objections: { voterNames: e.target.value } } })}>
                      <option>Public</option>
                      <option>Anonymous</option>
                    </select>
                  </Field>
                  <Toggle label="Observers Anonymized (Always On)" checked={true} onChange={() => {}} />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="consent">
              <AccordionTrigger>Consent & Objections</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Toggle label="Allow Reservation Note with Consent" checked={settings.consent.allowReservationNote} onChange={(v) => setSettings({ ...settings, consent: { allowReservationNote: v } })} />
                  <Toggle label="Require Harm Statement" checked={settings.objection.requireHarmStatement} onChange={(v) => setSettings({ ...settings, objection: { ...settings.objection, requireHarmStatement: v } })} />
                  <Toggle label="Require Strength Scale" checked={settings.objection.requireStrengthScale} onChange={(v) => setSettings({ ...settings, objection: { ...settings.objection, requireStrengthScale: v } })} />
                  <Toggle label="Allow Shared Objections" checked={settings.objection.allowShares} onChange={(v) => setSettings({ ...settings, objection: { ...settings.objection, allowShares: v } })} />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="facilitation">
              <AccordionTrigger>Facilitation & Editing</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Editors">
                    <select className="border rounded-md p-2" value={settings.resolution.editors} onChange={(e) => setSettings({ ...settings, resolution: { ...settings.resolution, editors: e.target.value } })}>
                      <option>Proposer + Facilitator</option>
                      <option>Proposer Only</option>
                      <option>Facilitator Only</option>
                    </select>
                  </Field>
                  <Toggle label="Require Patch Note" checked={settings.resolution.requirePatchNote} onChange={(v) => setSettings({ ...settings, resolution: { ...settings.resolution, requirePatchNote: v } })} />
                  <Toggle label="Objector Acknowledgement Required" checked={settings.resolution.objectorAckRequired} onChange={(v) => setSettings({ ...settings, resolution: { ...settings.resolution, objectorAckRequired: v } })} />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="overrides">
              <AccordionTrigger>Overrides</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Toggle label="Allow Per-Proposal Timers" checked={settings.overrides.allowPerProposalTimers} onChange={(v) => setSettings({ ...settings, overrides: { ...settings.overrides, allowPerProposalTimers: v } })} />
                  <Toggle label="Manual Advance by Facilitator" checked={settings.overrides.allowManualAdvanceByFacilitator} onChange={(v) => setSettings({ ...settings, overrides: { ...settings.overrides, allowManualAdvanceByFacilitator: v } })} />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="handoff">
              <AccordionTrigger>Decision Body & Handoff</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Final Authority">
                    <select className="border rounded-md p-2" value={settings.handoff.finalAuthority} onChange={(e) => setSettings({ ...settings, handoff: { ...settings.handoff, finalAuthority: e.target.value } })}>
                      <option>Board</option>
                      <option>Assembly</option>
                      <option>Other</option>
                    </select>
                  </Field>
                  <Field label="Handoff Email">
                    <Input type="email" value={settings.handoff.email} onChange={(e) => setSettings({ ...settings, handoff: { ...settings.handoff, email: e.target.value } })} />
                  </Field>
                  <Field label="Handoff Cellphone">
                    <Input value={settings.handoff.cellphone} onChange={(e) => setSettings({ ...settings, handoff: { ...settings.handoff, cellphone: e.target.value } })} />
                  </Field>
                  <Toggle label="Auto-send Final Report" checked={settings.handoff.autoSendFinalReport} onChange={(v) => setSettings({ ...settings, handoff: { ...settings.handoff, autoSendFinalReport: v } })} />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="reports">
              <AccordionTrigger>Reports & Exports</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Toggle label="Include Final Text" checked={settings.report.includeFinalText} onChange={(v) => setSettings({ ...settings, report: { ...settings.report, includeFinalText: v } })} />
                  <Toggle label="Include Participation Stats" checked={settings.report.includeParticipationStats} onChange={(v) => setSettings({ ...settings, report: { ...settings.report, includeParticipationStats: v } })} />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="assembly">
              <AccordionTrigger>Assembly Tools</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Toggle label="Enable Sub-circle Nominations" checked={settings.assembly.nominations.enabled} onChange={(v) => setSettings({ ...settings, assembly: { nominations: { ...settings.assembly.nominations, enabled: v } } })} />
                  <Field label="Nomination Threshold">
                    <select className="border rounded-md p-2" value={settings.assembly.nominations.threshold} onChange={(e) => setSettings({ ...settings, assembly: { nominations: { ...settings.assembly.nominations, threshold: e.target.value } } })}>
                      <option>Majority</option>
                      <option>Two-Thirds</option>
                      <option>Unanimous</option>
                    </select>
                  </Field>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="pt-4">
            <Button onClick={save} disabled={saving || (!org && !orgName.trim())}>{saving ? 'Saving…' : 'Save Settings'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center space-x-2">
      <input type="checkbox" className="h-4 w-4" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-sm text-gray-800">{label}</span>
    </label>
  );
}
